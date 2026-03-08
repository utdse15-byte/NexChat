import type { ConfigStoreState } from './types';

export const defaultConfig: ConfigStoreState = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  systemPrompt: '',
  maxContextRounds: 10,
  temperature: 1,
  maxTokens: 0,
  firstByteTimeout: 30000,
  streamIdleTimeout: 15000,
  sendOnEnter: true,
  rememberConfig: true,
};
