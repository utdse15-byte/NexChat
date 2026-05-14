import type { Provider, FinishReason, DeltaPayload, ErrorPayload } from '../transport/types';

/** OpenAI 流式 chunk 的最小类型 */
interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
}

interface OpenAIErrorBody {
  error?: { message?: string };
}

function isStreamChunk(value: unknown): value is OpenAIStreamChunk {
  return typeof value === 'object' && value !== null && 'choices' in value;
}

export const openAIProvider: Provider = {
  name: 'openai',

  buildRequest(config, contextMessages) {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const body: Record<string, unknown> = {
      model: config.model,
      messages: contextMessages,
      stream: true,
      temperature: config.temperature,
    };

    if (config.maxTokens > 0) {
      body.max_tokens = config.maxTokens;
    }

    return { url, headers, body };
  },

  extractDelta(parsed: DeltaPayload): string | null {
    if (!isStreamChunk(parsed)) return null;
    const content = parsed.choices?.[0]?.delta?.content;
    return typeof content === 'string' && content.length > 0 ? content : null;
  },

  extractError(body: ErrorPayload): string {
    const errBody = body as OpenAIErrorBody | null | undefined;
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
