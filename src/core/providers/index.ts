import { openAIProvider } from './openai';
import type { Provider } from '../transport/types';

export const providers: Record<string, Provider> = {
  openai: openAIProvider,
};

export function getProvider(name: string): Provider {
  return providers[name] || openAIProvider;
}
