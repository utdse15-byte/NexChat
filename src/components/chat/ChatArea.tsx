import FloatingInput from '../input/FloatingInput';
import MessageList from './MessageList';

export default function ChatArea() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">
      <MessageList />
      
      <div className="flex-none pb-[env(safe-area-inset-bottom)] pt-4 max-w-3xl mx-auto w-full px-4 relative z-10 bg-linear-to-t from-slate-950 via-slate-950 to-transparent">
        <FloatingInput />
        <div className="text-center text-[10px] sm:text-xs text-slate-500 mt-2 mb-2">
          AI 可能会犯错。仅存储在本地浏览器，不发送到第三方，但本地存储非绝对安全。
        </div>
      </div>
    </div>
  );
}
