import { ArrowDownOutlined } from '@ant-design/icons';

export default function ScrollToBottom({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-slate-800 border border-white/20 shadow-xl text-slate-300 hover:text-cyan-400 hover:border-cyan-400/50 flex items-center justify-center transition-all z-50 cursor-pointer"
      title="回到最新消息"
    >
      <ArrowDownOutlined />
    </button>
  );
}
