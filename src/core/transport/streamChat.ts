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
    if (error.name === 'AbortError' && !error.message?.includes('超时')) {
      callbacks.onAbort();
      return;
    }
    // If it's an abort caused by our manual timeout throw, it falls through here:
    callbacks.onError(classifyFetchError(error, config.baseUrl));
    return;
  }

  if (!response.ok) {
    // Fast failure for error responses to avoid hanging on large error bodies
    const errorMsg = await Promise.race([
      classifyResponseError(response),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('分类错误响应超时')), 5000))
    ]).catch(err => ({
      type: 'protocol_error',
      message: `请求失败 (${response.status}): ` + err.message,
      retryable: true
    }));
    
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
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          jsonErrorCount = 0; // reset on success

          if (provider.isStreamDone(parsed)) {
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
    callbacks.onDone();
  } catch (error: any) {
    if ((signal.aborted || error.name === 'AbortError') && !error.message?.includes('超时')) {
      callbacks.onAbort();
    } else {
      const isProtocol = error.message?.includes('解析');
      callbacks.onError({
        type: isProtocol ? 'protocol_error' : 'network_error',
        message: '读取数据流时出错: ' + error.message,
        retryable: true
      });
    }
  } finally {
    reader.releaseLock();
  }
}
