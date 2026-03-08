import type { Message } from '../../domain/chat/types';
import ErrorMessage from './ErrorMessage';
import PendingIndicator from './PendingIndicator';
import StreamingCursor from './StreamingCursor';
import MarkdownRenderer from './MarkdownRenderer';
import { useChatStore } from '../../domain/chat/chatStore';

export default function AssistantMessage({ message }: { message: Message }) {
  const { status, content: persistedContent, error, id } = message;
  const streamingContent = useChatStore(state => state.streamingContent[id]);
  const displayContent = streamingContent || persistedContent;

  return (
    <div className="flex w-full justify-start mb-6">
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-400 to-blue-500 shrink-0 mr-4 shadow-lg flex items-center justify-center text-white text-xs mt-1">
        AI
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-start text-slate-100 pt-1 leading-relaxed">
        {status === 'pending' && <PendingIndicator />}
        
        {displayContent && (
          <div className="w-full relative">
            <MarkdownRenderer content={displayContent} />
            {status === 'streaming' && <StreamingCursor />}
          </div>
        )}

        {status === 'aborted' && (
          <div className="mt-2 text-xs px-2 py-1 rounded border-l-2 border-amber-500 text-amber-500 bg-amber-500/10">
            已停止生成
          </div>
        )}

        {status === 'reconnecting' && (
          <div className="mt-2 text-xs px-2 py-1 rounded border-l-2 border-cyan-500 text-cyan-500 bg-cyan-500/10 flex items-center space-x-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
            <span>网络异常，正在尝试重新连接...</span>
          </div>
        )}

        {status === 'error' && error && (
          <ErrorMessage error={error} messageId={id} />
        )}
      </div>
    </div>
  );
}
