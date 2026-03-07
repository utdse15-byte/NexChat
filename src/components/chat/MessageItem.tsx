import React from 'react';
import { useChatStore } from '../../domain/chat/chatStore';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';

const MessageItem = React.memo(({ messageId }: { messageId: string }) => {
  const message = useChatStore(state => state.messages[messageId]);
  
  if (!message) return null;

  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }
  
  return <AssistantMessage message={message} />;
});

export default MessageItem;
