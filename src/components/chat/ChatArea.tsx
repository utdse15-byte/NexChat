import FloatingInput from '../input/FloatingInput';
import MessageList from './MessageList';

export default function ChatArea() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">
      <MessageList />
      
      <div className="flex-none pb-[env(safe-area-inset-bottom)] pt-4 max-w-3xl mx-auto w-full px-4 relative z-10 bg-linear-to-t from-slate-950 via-slate-950 to-transparent">
        <FloatingInput />
        <div className="text-center text-[10px] sm:text-xs text-slate-500 mt-2 mb-2">
          AI 可能会犯错。消息会发送到你配置的模型服务或后端；历史记录默认保存在本地浏览器，后端模式下也会写入服务端数据库。
        </div>
      </div>
    </div>
  );
}
