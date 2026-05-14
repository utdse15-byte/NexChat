import type { Provider, FinishReason, DeltaPayload, ErrorPayload } from '../transport/types';

/**
 * 后端模式 Provider
 *
 * 将请求发送到 NexChat FastAPI 后端（POST {backendUrl}/chat/stream），
 * 后端返回 OpenAI 兼容的 SSE 流，因此 extractDelta / getFinishReason
 * 与 openAIProvider 完全一致。
 *
 * 与 openAIProvider 的差异：
 * 1. URL 指向后端而非 LLM 服务
 * 2. 不需要 Authorization header（API Key 存放在后端 .env）
 * 3. body 中携带 session_id 用于后端会话持久化
 */

interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
}

interface BackendErrorBody {
  error?: { message?: string };
}

function isStreamChunk(value: unknown): value is OpenAIStreamChunk {
  return typeof value === 'object' && value !== null && 'choices' in value;
}

export const backendProvider: Provider = {
  name: 'NexChat 后端',

  buildRequest(config, contextMessages, extras) {
    const backendUrl = config.backendUrl.replace(/\/$/, '');
    const url = `${backendUrl}/chat/stream`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const body: Record<string, unknown> = {
      messages: contextMessages,
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: true,
    };

    if (extras?.sessionId) {
      body.session_id = extras.sessionId;
    }

    return { url, headers, body };
  },

  extractDelta(parsed: DeltaPayload): string | null {
    if (!isStreamChunk(parsed)) return null;
    const content = parsed.choices?.[0]?.delta?.content;
    return typeof content === 'string' && content.length > 0 ? content : null;
  },

  extractError(body: ErrorPayload): string {
    const errBody = body as BackendErrorBody | null | undefined;
    return errBody?.error?.message || JSON.stringify(body);
  },

  getFinishReason(parsed: DeltaPayload): FinishReason | null {
    if (!isStreamChunk(parsed)) return null;
    const reason = parsed.choices?.[0]?.finish_reason;
    if (reason === 'stop' || reason === 'length') {
      return reason;
    }
    return null;
  },
};
