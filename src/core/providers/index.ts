import { openAIProvider } from './openai';
import { backendProvider } from './backend';
import type { Provider } from '../transport/types';

export const providers: Record<string, Provider> = {
  openai: openAIProvider,
  backend: backendProvider,
};

export function getProvider(name: string): Provider {
  return providers[name] || openAIProvider;
}
