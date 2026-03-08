import type { ChatError } from '../../core/errors/types';

export type MessageStatus = 'pending' | 'streaming' | 'done' | 'aborted' | 'error' | 'reconnecting';

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  createdAt: number;
  model?: string;
  error?: ChatError;
}

export interface Session {
  id: string;
  title: string;
  messageIds: string[];
  createdAt: number;
  updatedAt: number;
}
