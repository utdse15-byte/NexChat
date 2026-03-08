import type { ChatError } from '../../core/errors/types';
import { useChatStream } from '../../hooks/useChatStream';
import { useUIStore } from '../../domain/ui/uiStore';

export default function ErrorMessage({ error, messageId }: { error: ChatError, messageId: string }) {
  const { retryMessage } = useChatStream();
  const setIsSettingsOpen = useUIStore(state => state.setIsSettingsOpen);

  const handleAction = () => {
    if (error.type === 'auth_error') {
      setIsSettingsOpen(true);
    } else if (error.retryable) {
      retryMessage(messageId);
    }
  };

  return (
    <div className="mt-2 text-sm px-3 py-2 rounded-lg border-l-4 border-red-500 bg-red-500/10 text-red-100 max-w-full">
      <div className="font-medium mb-1">
        {error.type === 'auth_error' && '认证失败'}
        {error.type === 'rate_limit' && '请求过于频繁'}
        {error.type === 'network_error' && '网络连接失败'}
        {error.type === 'timeout' && '请求超时'}
        {error.type === 'server_error' && '服务端错误'}
        {error.type === 'protocol_error' && '协议解析错误'}
        {error.type === 'unknown_error' && '发生了未知错误'}
      </div>
      <div className="text-red-200/80 mb-2 break-all">{error.message}</div>
      <button 
        onClick={handleAction}
        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded transition-colors cursor-pointer"
      >
        {error.type === 'auth_error' ? '前往设置' : '重试'}
      </button>
    </div>
  );
}
