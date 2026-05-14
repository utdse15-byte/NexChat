import { useState } from 'react';
import { useConfigStore } from '../domain/config/configStore';

export function useConfigGuard() {
  const isConfigured = useConfigStore(state => {
    if (state.backendEnabled) {
      // 后端模式：API Key 和 model 都由后端 .env 决定，前端只需要后端地址
      return Boolean(state.backendUrl);
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
