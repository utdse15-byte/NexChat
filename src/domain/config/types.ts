export interface ConfigStoreState {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  maxContextRounds: number;
  temperature: number;
  maxTokens: number;
  firstByteTimeout: number;
  streamIdleTimeout: number;
  sendOnEnter: boolean;
  rememberConfig: boolean;
}
