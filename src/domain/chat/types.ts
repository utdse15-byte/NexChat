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
  /**
   * 非阻塞提示信息（如 length 截断），与 error 不同：
   * - warning 不会改变 status，消息仍以 done 态展示
   * - UI 层在 status === 'done' 时单独渲染（黄色提示块）
   */
  warning?: ChatError;
  /** Agent 类型标识（后端模式下由 Router Agent 分配） */
  agentType?: 'chat' | 'rag' | 'summary';
  /** RAG 引用来源（后端模式下由 RAG Agent 返回） */
  sources?: Array<{ content: string; document_name: string; relevance: number; chunk_index: number }>;
}

export interface Session {
  id: string;
  title: string;
  messageIds: string[];
  createdAt: number;
  updatedAt: number;
}
