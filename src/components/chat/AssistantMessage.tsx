import type { Message } from '../../domain/chat/types';
import ErrorMessage from './ErrorMessage';
import PendingIndicator from './PendingIndicator';
import StreamingCursor from './StreamingCursor';
import MarkdownRenderer from './MarkdownRenderer';

export default function AssistantMessage({ message }: { message: Message }) {
  const { status, content, error, id } = message;

  return (
    <div className="flex w-full justify-start mb-6">
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-400 to-blue-500 shrink-0 mr-4 shadow-lg flex items-center justify-center text-white text-xs mt-1">
        AI
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-start text-slate-100 pt-1 leading-relaxed">
        {status === 'pending' && <PendingIndicator />}
        
        {content && (
          <div className="w-full relative">
            <MarkdownRenderer content={content} />
            {status === 'streaming' && <StreamingCursor />}
          </div>
        )}

        {status === 'aborted' && (
          <div className="mt-2 text-xs px-2 py-1 rounded border-l-2 border-amber-500 text-amber-500 bg-amber-500/10">
            已停止生成
          </div>
        )}

        {status === 'error' && error && (
          <ErrorMessage error={error} messageId={id} />
        )}
      </div>
    </div>
  );
}
