import type {
  StreamCallbacks,
  Provider,
  BuildRequestExtras,
  AgentMetadata,
  RagSource,
} from './types';
import type { ConfigStoreState } from '../../domain/config/types';
import { createSSEParser, type SSEEvent } from './sseParser';
import { classifyFetchError, classifyResponseError } from '../errors/classifyError';
import type { ChatError } from '../errors/types';

interface StreamChatParams {
  provider: Provider;
  config: ConfigStoreState;
  contextMessages: Array<{ role: string; content: string }>;
  signal: AbortSignal;
  callbacks: StreamCallbacks;
  extras?: BuildRequestExtras;
}

export async function streamChat({
  provider,
  config,
  contextMessages,
  signal,
  callbacks,
  extras,
}: StreamChatParams) {
  const MAX_RETRIES = 3;
  let attempt = 0;
  let hasReceivedServerEvent = false;

  const runWithRetry = async (): Promise<void> => {
    if (signal.aborted) {
      callbacks.onAbort();
      return;
    }

    let response: Response;
    try {
      const { url, headers, body } = provider.buildRequest(config, contextMessages, extras);

      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
      });
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err.name === 'AbortError' || signal.aborted) {
        const reason = signal.reason;
        if (reason instanceof Error && reason.message.includes('超时')) {
          // 超时由 handleTimeout 处理，避免重复
          return;
        }
        callbacks.onAbort();
        return;
      }

      const chatError = classifyFetchError(error, config.baseUrl);
      if (chatError.retryable && attempt < MAX_RETRIES && !hasReceivedServerEvent) {
        return retry(chatError);
      }

      callbacks.onError(chatError);
      return;
    }

    if (!response.ok) {
      const errorMsg = await Promise.race([
        classifyResponseError(response),
        new Promise<ChatError>((_, reject) =>
          setTimeout(() => reject(new Error('分类错误响应超时')), 5000)
        ),
      ]).catch((err): ChatError => ({
        type: 'protocol_error',
        message: `请求失败 (${response.status}): ` + (err as Error).message,
        retryable: true,
      }));

      if (errorMsg.retryable && attempt < MAX_RETRIES && !hasReceivedServerEvent) {
        return retry(errorMsg);
      }

      callbacks.onError(errorMsg);
      return;
    }

    if (!response.body) {
      callbacks.onError({
        type: 'protocol_error',
        message: '服务器未返回流数据',
        retryable: true,
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

        const result = processEvents(events, provider, callbacks, jsonErrorCount, hasReceivedServerEvent);
        jsonErrorCount = result.jsonErrorCount;
        hasReceivedServerEvent = result.hasReceivedServerEvent;
        if (result.finished) return;
      }

      // 流结束后，处理 SSE 缓冲区中可能残留的不完整事件
      // 通过追加分隔符触发 flush（若尾部数据本就完整则无副作用）
      if (sseParser.getRest().trim()) {
        const finalEvents = sseParser.parse('\n\n');
        const result = processEvents(finalEvents, provider, callbacks, jsonErrorCount, hasReceivedServerEvent);
        jsonErrorCount = result.jsonErrorCount;
        hasReceivedServerEvent = result.hasReceivedServerEvent;
        if (result.finished) return;
      }

      // reader 自然结束但服务端没发显式终止标记
      callbacks.onDone('stop');
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (signal.aborted || err.name === 'AbortError') {
        const reason = signal.reason;
        if (reason instanceof Error && reason.message.includes('超时')) {
          return;
        }
        callbacks.onAbort();
      } else {
        const isProtocol = err.message?.includes('解析');
        const chatError: ChatError = {
          type: isProtocol ? 'protocol_error' : 'network_error',
          message: '读取数据流时出错: ' + (err.message ?? '未知错误'),
          retryable: !isProtocol,
        };

        if (chatError.retryable && attempt < MAX_RETRIES && !hasReceivedServerEvent) {
          return retry(chatError);
        }

        callbacks.onError(chatError);
      }
    } finally {
      reader.releaseLock();
    }
  };

  const retry = async (_error: ChatError) => {
    attempt++;
    const delay = Math.pow(2, attempt) * 1000;
    callbacks.onRetry?.(attempt, delay);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return runWithRetry();
  };

  return runWithRetry();
}

/**
 * 处理 SSE 事件列表，返回是否流已结束以及最新的 JSON 解析错误计数
 */
function processEvents(
  events: SSEEvent[],
  provider: Provider,
  callbacks: StreamCallbacks,
  jsonErrorCount: number,
  hasReceivedServerEvent: boolean
): { finished: boolean; jsonErrorCount: number; hasReceivedServerEvent: boolean } {
  if (events.length > 0) {
    hasReceivedServerEvent = true;
  }
  for (const event of events) {
    // 自定义事件：metadata（Agent 路由信息）
    if (event.event === 'metadata') {
      try {
        const meta = JSON.parse(event.data) as AgentMetadata;
        callbacks.onMetadata?.(meta);
      } catch {
        // metadata 解析失败不致命，跳过
      }
      continue;
    }

    // 自定义事件：sources（RAG 引用来源）
    if (event.event === 'sources') {
      try {
        const sources = JSON.parse(event.data) as RagSource[];
        if (Array.isArray(sources)) {
          callbacks.onSources?.(sources);
        }
      } catch {
        // sources 解析失败不致命，跳过
      }
      continue;
    }

    // 默认 message 事件
    if (event.data === '[DONE]') {
      callbacks.onDone('stop');
      return { finished: true, jsonErrorCount, hasReceivedServerEvent };
    }

    try {
      const parsed: unknown = JSON.parse(event.data);
      jsonErrorCount = 0;

      // 后端在异常路径下会返回 { error: { message, type } }，
      // 此 payload 不含 choices，会被 extractDelta/getFinishReason 静默丢弃，
      // 紧跟其后的 [DONE] 又会被当作正常完成。
      // 这里显式识别 error 字段并以 onError 终止流，避免错误被吞。
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'error' in parsed &&
        (parsed as { error: unknown }).error
      ) {
        const errBody = (parsed as { error: { message?: string; type?: string } }).error;
        const message =
          (typeof errBody === 'object' && errBody && typeof errBody.message === 'string'
            ? errBody.message
            : undefined) || '服务端返回错误';
        callbacks.onError({
          type: 'server_error',
          message,
          retryable: true,
        });
        return { finished: true, jsonErrorCount, hasReceivedServerEvent };
      }

      const finishReason = provider.getFinishReason(parsed);
      if (finishReason) {
        callbacks.onDone(finishReason);
        return { finished: true, jsonErrorCount, hasReceivedServerEvent };
      }

      const delta = provider.extractDelta(parsed);
      if (delta) {
        callbacks.onDelta(delta);
      }
    } catch {
      jsonErrorCount++;
      if (jsonErrorCount >= 10) {
        throw new Error('连续 10 次解析流数据失败');
      }
    }
  }
  return { finished: false, jsonErrorCount, hasReceivedServerEvent };
}
