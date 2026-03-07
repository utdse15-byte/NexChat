import type { Provider } from '../transport/types';

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

    const body: Record<string, any> = {
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

  extractDelta(parsed: any): string | null {
    if (parsed?.choices?.[0]?.delta?.content) {
      return parsed.choices[0].delta.content;
    }
    return null;
  },

  extractError(body: any): string {
    return body?.error?.message || JSON.stringify(body);
  },

  isStreamDone(parsed: any): boolean {
    return parsed?.choices?.[0]?.finish_reason === 'stop' || parsed?.choices?.[0]?.finish_reason === 'length';
  }
};
