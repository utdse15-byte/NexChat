import { useState } from 'react';
import { useConfigStore } from '../domain/config/configStore';

export function useConfigGuard() {
  const isConfigured = useConfigStore(state => {
    if (state.backendEnabled) {
      // 后端模式：API Key 存在后端 .env 中，前端只需检查 model 和 backendUrl
      return Boolean(state.model && state.backendUrl);
    }
    return Boolean(state.provider && state.apiKey && state.baseUrl && state.model);
  });
  const [showConfigModal, setShowConfigModal] = useState(false);

  const checkConfig = () => {
    if (!isConfigured) {
      setShowConfigModal(true);
      return false;
    }
    return true;
  };

  return { isConfigured, showConfigModal, setShowConfigModal, checkConfig };
}
