import { useChatStream } from '../../hooks/useChatStream';
import { useConfigGuard } from '../../hooks/useConfigGuard';

export default function WelcomeScreen() {
  const { sendMessage } = useChatStream();
  const { checkConfig } = useConfigGuard();

  const handleTipClick = (tip: string) => {
    if (checkConfig()) {
      sendMessage(tip);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
        <div className="text-3xl">✨</div>
      </div>
      <h2 className="text-2xl font-medium text-slate-100 mb-8">有什么我可以帮你的？</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {['解释量子计算', '写一段贪吃蛇代码', '总结年度总结框架', '生成中秋节祝词'].map((tip) => (
          <div 
            key={tip} 
            onClick={() => handleTipClick(tip)}
            className="p-4 rounded-xl border border-white/10 bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors text-left"
          >
            <p className="text-sm text-slate-300">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
