export interface ConfigStoreState {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  maxContextRounds: number;
  temperature: number;
  maxTokens: number;
  maxContextTokens: number;
  firstByteTimeout: number;
  streamIdleTimeout: number;
  sendOnEnter: boolean;
  rememberConfig: boolean;
}
