import { PlusOutlined } from '@ant-design/icons';
import { useChatStore } from '../../domain/chat/chatStore';

export default function NewChatButton({ onClick }: { onClick?: () => void }) {
  const createSession = useChatStore(state => state.createSession);

  const handleNewChat = () => {
    createSession();
    if (onClick) onClick();
  };

  return (
    <button 
      onClick={handleNewChat}
      className="flex w-full items-center gap-2 rounded-lg border border-white/20 px-4 py-3 hover:bg-slate-800 transition-colors text-sm text-slate-50 cursor-pointer font-medium"
    >
      <PlusOutlined />
      <span>New Chat</span>
    </button>
  );
}
