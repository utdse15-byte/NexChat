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
  /** 是否启用后端模式（通过 FastAPI 代理而非直连 LLM API） */
  backendEnabled: boolean;
  /** 后端 API 地址 */
  backendUrl: string;
}
