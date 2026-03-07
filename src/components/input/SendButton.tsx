import { ArrowUpOutlined, StopOutlined } from '@ant-design/icons';

interface SendButtonProps {
  isStreaming: boolean;
  disabled: boolean;
  onSend: () => void;
  onStop: () => void;
}

export default function SendButton({ isStreaming, disabled, onSend, onStop }: SendButtonProps) {
  if (isStreaming) {
    return (
      <button 
        onClick={onStop}
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border shadow-lg cursor-pointer border-white/20 hover:bg-slate-700 text-slate-200 transition-colors mb-1 mr-1"
        title="停止生成"
      >
        <StopOutlined />
      </button>
    );
  }

  return (
    <button 
      onClick={onSend}
      disabled={disabled}
      className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors mb-1 mr-1 cursor-pointer disabled:cursor-not-allowed ${
        disabled 
          ? 'bg-white/10 text-white/30' 
          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
      }`}
      title="发送"
    >
      <ArrowUpOutlined />
    </button>
  );
}
