import type { ChatError } from '../errors/types';
import type { ConfigStoreState } from '../../domain/config/types';

export type FinishReason = 'stop' | 'length' | string;

/** Provider.buildRequest 的额外上下文（与 LLM body 无关，但供 Provider 参考） */
export interface BuildRequestExtras {
  /** 会话 ID（后端模式下用于关联消息持久化） */
  sessionId?: string;
}

export interface BuiltRequest {
  url: string;
  headers: Record<string, string>;
  body: object;
}

/** Provider 处理的 SSE delta payload，使用 unknown 强制调用方做类型守卫 */
export type DeltaPayload = unknown;

/** Provider 接收的错误响应体，使用 unknown 强制调用方做类型守卫 */
export type ErrorPayload = unknown;

export interface Provider {
  name: string;
  buildRequest(
    config: ConfigStoreState,
    contextMessages: Array<{ role: string; content: string }>,
    extras?: BuildRequestExtras
  ): BuiltRequest;
  extractDelta(parsed: DeltaPayload): string | null;
  extractError(body: ErrorPayload): string;
  /** 流结束时返回 finish_reason，否则返回 null */
  getFinishReason(parsed: DeltaPayload): FinishReason | null;
}

/** 后端 SSE metadata 事件 payload */
export interface AgentMetadata {
  agent_type?: 'chat' | 'rag' | 'summary';
  session_id?: string;
}

/** 后端 SSE sources 事件 payload */
export interface RagSource {
  content: string;
  document_name: string;
  relevance: number;
  chunk_index: number;
}

export interface StreamCallbacks {
  onDelta: (delta: string) => void;
  onDone: (finishReason: FinishReason) => void;
  onError: (error: ChatError) => void;
  onAbort: () => void;
  onRetry?: (attempt: number, delay: number) => void;
  /** 后端模式下接收 Agent 元信息（agent_type / session_id 等） */
  onMetadata?: (metadata: AgentMetadata) => void;
  /** 后端模式下接收 RAG 引用来源 */
  onSources?: (sources: RagSource[]) => void;
}
