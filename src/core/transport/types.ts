import type { ChatError } from '../errors/types';
import type { ConfigStoreState } from '../../domain/config/types';

export interface Provider {
  name: string;
  buildRequest(config: ConfigStoreState, contextMessages: Array<{ role: string; content: string }>): { url: string; headers: Record<string, string>; body: object };
  extractDelta(parsed: any): string | null;
  extractError(body: any): string;
  isStreamDone(parsed: any): boolean;
}

export interface StreamCallbacks {
  onDelta: (delta: string) => void;
  onDone: () => void;
  onError: (error: ChatError) => void;
  onAbort: () => void;
  onRetry?: (attempt: number, delay: number) => void;
}
