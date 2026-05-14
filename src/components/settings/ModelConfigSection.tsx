import { Input, Slider } from 'antd';
import { useConfigStore } from '../../domain/config/configStore';

export default function ModelConfigSection() {
  const {
    model,
    temperature,
    maxContextRounds,
    maxContextTokens,
    firstByteTimeout,
    streamIdleTimeout,
    backendEnabled,
    updateConfig,
  } = useConfigStore();

  return (
    <section className="space-y-6">
      <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">模型与对话参数</h3>
      
      <div>
        <label className="block text-sm text-slate-400 mb-1.5 font-medium">
          模型名称
          {!backendEnabled && <span className="text-red-400"> *</span>}
        </label>
        <Input
          value={model}
          onChange={(e) => updateConfig({ model: e.target.value })}
          placeholder={backendEnabled ? '留空则使用后端 .env 中的 CHAT_MODEL' : '例如：gpt-4o'}
          className="bg-slate-800/50 border-white/10 text-slate-200 hover:border-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.2)]"
        />
        {backendEnabled && (
          <p className="text-xs text-slate-500 mt-1.5">
            后端模式下此项可选；填写后会覆盖后端默认模型。
          </p>
        )}
      </div>

      <div>
        <div className="flex justify-between text-sm text-slate-400 font-medium mb-1.5">
          <label>Temperature (多样性)</label>
          <span className="text-cyan-400">{temperature}</span>
        </div>
        <Slider
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={val => updateConfig({ temperature: val })}
          className="mx-2"
          tooltip={{ open: false }}
        />
        <div className="flex justify-between text-xs text-slate-500 font-light mt-1">
          <span>0 (精确)</span>
          <span>2 (发散)</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm text-slate-400 font-medium mb-1.5">
          <label>包含历史消息轮数</label>
          <span className="text-cyan-400">{maxContextRounds}</span>
        </div>
        <Slider
          min={0}
          max={50}
          step={1}
          value={maxContextRounds}
          onChange={val => updateConfig({ maxContextRounds: val })}
          className="mx-2"
          tooltip={{ open: false }}
        />
        <p className="text-xs text-slate-500 mt-1">控制送往 AI 的上下文记忆范围。越多的历史轮数会消耗更多的 Token。设置为 0 则每次为全新对话。</p>
      </div>

      <div>
        <div className="flex justify-between text-sm text-slate-400 font-medium mb-1.5">
          <label>最大上下文 Token 数</label>
          <span className="text-cyan-400">{maxContextTokens}</span>
        </div>
        <Slider
          min={1000}
          max={32000}
          step={500}
          value={maxContextTokens}
          onChange={val => updateConfig({ maxContextTokens: val })}
          className="mx-2"
          tooltip={{ open: false }}
        />
        <p className="text-xs text-slate-500 mt-1">控制送往 AI 的上下文 Token 数量。超出部分将自动截断。建议根据模型窗口设置（如 GPT-3.5 设为 4000）。</p>
      </div>

      <div>
        <div className="flex justify-between text-sm text-slate-400 font-medium mb-1.5">
          <label>首字节超时 (秒)</label>
          <span className="text-cyan-400">{Math.round(firstByteTimeout / 1000)}</span>
        </div>
        <Slider
          min={5}
          max={120}
          step={5}
          value={Math.round(firstByteTimeout / 1000)}
          onChange={val => updateConfig({ firstByteTimeout: val * 1000 })}
          className="mx-2"
          tooltip={{ open: false }}
        />
        <p className="text-xs text-slate-500 mt-1">从发出请求到收到首个事件（含后端路由元信息）的最长等待时间。Gemini 3.x 等思考型模型建议 ≥ 60 秒。</p>
      </div>

      <div>
        <div className="flex justify-between text-sm text-slate-400 font-medium mb-1.5">
          <label>流式空闲超时 (秒)</label>
          <span className="text-cyan-400">{Math.round(streamIdleTimeout / 1000)}</span>
        </div>
        <Slider
          min={5}
          max={120}
          step={5}
          value={Math.round(streamIdleTimeout / 1000)}
          onChange={val => updateConfig({ streamIdleTimeout: val * 1000 })}
          className="mx-2"
          tooltip={{ open: false }}
        />
        <p className="text-xs text-slate-500 mt-1">流式输出中两次相邻数据块的最长间隔。模型在思考阶段可能长时间无输出，思考型模型建议 ≥ 60 秒。</p>
      </div>
    </section>
  );
}
