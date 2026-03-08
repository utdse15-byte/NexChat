import type { StreamCallbacks, Provider } from './types';
import type { ConfigStoreState } from '../../domain/config/types';
import { createSSEParser, extractDataFromEvent } from './sseParser';
import { classifyFetchError, classifyResponseError } from '../errors/classifyError';

interface StreamChatParams {
  provider: Provider;
  config: ConfigStoreState;
  contextMessages: Array<{ role: string; content: string }>;
  signal: AbortSignal;
  callbacks: StreamCallbacks;
}

export async function streamChat({
  provider,
  config,
  contextMessages,
  signal,
  callbacks,
}: StreamChatParams) {
  const MAX_RETRIES = 3;
  let attempt = 0;

  const runWithRetry = async (): Promise<void> => {
    let response: Response;
    try {
      const { url, headers, body } = provider.buildRequest(config, contextMessages);
      
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      });
    } catch (error: any) {
      if ((error.name === 'AbortError' || signal.aborted) && !error.message?.includes('超时')) {
        callbacks.onAbort();
        return;
      }

      const chatError = classifyFetchError(error, config.baseUrl);
      if (chatError.retryable && attempt < MAX_RETRIES) {
        return retry(chatError);
      }
      
      callbacks.onError(chatError);
      return;
    }

    if (!response.ok) {
      const errorMsg = await Promise.race([
        classifyResponseError(response),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('分类错误响应超时')), 5000))
      ]).catch(err => ({
        type: 'protocol_error',
        message: `请求失败 (${response.status}): ` + err.message,
        retryable: true
      }));
      
      if (errorMsg.retryable && attempt < MAX_RETRIES) {
        return retry(errorMsg);
      }

      callbacks.onError(errorMsg);
      return;
    }

    if (!response.body) {
      callbacks.onError({
        type: 'protocol_error',
        message: '服务器未返回流数据',
        retryable: true
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    const sseParser = createSSEParser();
    let jsonErrorCount = 0;
    let isFinished = false;

    try {
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const events = sseParser.parse(chunk);
        
        for (const event of events) {
          const dataLines = extractDataFromEvent(event);
          if (dataLines.length === 0) continue;
          
          const dataStr = dataLines.join('\n');
          
          if (dataStr === '[DONE]') {
            isFinished = true;
            callbacks.onDone();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            jsonErrorCount = 0; // reset on success

            if (provider.isStreamDone(parsed)) {
              isFinished = true;
              callbacks.onDone();
              return;
            }

            const delta = provider.extractDelta(parsed);
            if (delta) {
              callbacks.onDelta(delta);
            }
          } catch (e) {
            jsonErrorCount++;
            if (jsonErrorCount >= 10) {
              throw new Error('连续 10 次解析流数据失败');
            }
          }
        }
      }

      if (!isFinished) {
        throw new Error('数据流异常中断，未收到结束标识');
      }
      
      callbacks.onDone();
    } catch (error: any) {
      if ((signal.aborted || error.name === 'AbortError') && !error.message?.includes('超时')) {
        callbacks.onAbort();
      } else {
        const isProtocol = error.message?.includes('解析');
        const chatError = {
          type: isProtocol ? 'protocol_error' as const : 'network_error' as const,
          message: '读取数据流时出错: ' + error.message,
          retryable: !isProtocol
        };

        if (chatError.retryable && attempt < MAX_RETRIES) {
          return retry(chatError);
        }

        callbacks.onError(chatError);
      }
    } finally {
      reader.releaseLock();
    }
  };

  const retry = async (_error: any) => {
    attempt++;
    const delay = Math.pow(2, attempt) * 1000;
    callbacks.onRetry?.(attempt, delay);
    await new Promise(resolve => setTimeout(resolve, delay));
    return runWithRetry();
  };

  return runWithRetry();
}
