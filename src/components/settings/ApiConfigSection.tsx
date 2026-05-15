import { Input, Select } from 'antd';
import { useConfigStore } from '../../domain/config/configStore';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { providers } from '../../core/providers';

export default function ApiConfigSection() {
  const { provider, apiKey, baseUrl, backendEnabled, backendToken, updateConfig } = useConfigStore();

  const providerOptions = Object.keys(providers).map(key => ({
    value: key,
    label: providers[key].name || key
  }));

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">API 配置</h3>

      <div>
        <label className="block text-sm text-slate-400 mb-1.5 font-medium">服务供应商 <span className="text-red-400">*</span></label>
        <Select
          value={provider}
          onChange={(val) => updateConfig({ provider: val })}
          options={providerOptions}
          className="w-full h-9"
          dropdownStyle={{ backgroundColor: '#1e293b' }}
           popupClassName="dark-select-popup"
        />
      </div>
      
      <div>
        <label className="block text-sm text-slate-400 mb-1.5 font-medium">API Key <span className="text-red-400">*</span></label>
        <Input.Password
          value={apiKey}
          onChange={(e) => updateConfig({ apiKey: e.target.value })}
          placeholder="sk-..."
          className="bg-slate-800/50 border-white/10 text-slate-200 hover:border-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.2)]"
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
        <p className="text-xs text-slate-500 mt-1.5">您的密钥仅存储在本地浏览器，不会上传至任何第三方服务器。</p>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1.5 font-medium">Base URL <span className="text-red-400">*</span></label>
        <Input
          value={baseUrl}
          onChange={(e) => updateConfig({ baseUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
          className="bg-slate-800/50 border-white/10 text-slate-200 hover:border-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.2)]"
        />
        <p className="text-xs text-slate-500 mt-1.5">支持任何兼容 OpenAI 格式的 API。对于某些中转 API，请务必包含 /v1 后缀。</p>
      </div>

      {backendEnabled && (
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">后端 Demo Token</label>
          <Input.Password
            value={backendToken}
            onChange={(e) => updateConfig({ backendToken: e.target.value })}
            placeholder="如果后端配置了 DEMO_TOKEN 请在此输入"
            className="bg-slate-800/50 border-white/10 text-slate-200 hover:border-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.2)]"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
          <p className="text-xs text-slate-500 mt-1.5">用于通过后端 /api/chat、/api/knowledge 等接口的鉴权。</p>
        </div>
      )}
    </section>
  );
}
