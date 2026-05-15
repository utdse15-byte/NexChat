/**
 * 后端模式设置区域
 * 切换直连 API / 后端代理模式，配置后端地址
 */
import { Input, Switch } from 'antd';
import { useConfigStore } from '../../domain/config/configStore';
import { ApiOutlined } from '@ant-design/icons';

export default function BackendConfigSection() {
  const { backendEnabled, backendUrl, updateConfig } = useConfigStore();

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
        <ApiOutlined className="mr-1.5" />
        后端模式
      </h3>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-300 font-medium">启用后端代理</div>
          <p className="text-xs text-slate-500 mt-0.5">
            通过 FastAPI 后端代理请求，启用 RAG 知识库和多 Agent 功能
          </p>
        </div>
        <Switch
          checked={backendEnabled}
          onChange={(checked) => updateConfig({ 
            backendEnabled: checked,
            model: checked ? '' : 'gpt-3.5-turbo'
          })}
          className={backendEnabled ? 'bg-cyan-500!' : ''}
        />
      </div>

      {backendEnabled && (
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">后端地址</label>
          <Input
            value={backendUrl}
            onChange={(e) => updateConfig({ backendUrl: e.target.value })}
            placeholder="/api"
            className="bg-slate-800/50 border-white/10 text-slate-200 hover:border-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.2)]"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            开发模式默认 /api（Vite 代理），生产环境可填完整地址如 http://localhost:8000/api
          </p>
        </div>
      )}
    </section>
  );
}
