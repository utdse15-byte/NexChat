import { useRef } from 'react';
import { useChatStore } from '../../domain/chat/chatStore';
import MessageItem from './MessageItem';
import WelcomeScreen from './WelcomeScreen';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import ScrollToBottom from './ScrollToBottom';

export default function MessageList() {
  const activeSessionId = useChatStore(state => state.activeSessionId);
  const session = useChatStore(state => activeSessionId ? state.sessions[activeSessionId] : null);
  const messageIds = session?.messageIds || [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const { isLocked, scrollToBottom } = useAutoScroll(scrollRef);

  if (!activeSessionId || messageIds.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6" ref={scrollRef}>
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-32">
          {messageIds.map((id) => (
            <MessageItem key={id} messageId={id} />
          ))}
        </div>
      </div>

      {!isLocked && <ScrollToBottom onClick={scrollToBottom} />}
    </div>
  );
}
