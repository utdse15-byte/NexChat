import { useState } from 'react';
import { useConfigStore } from '../domain/config/configStore';

export function useConfigGuard() {
  const isConfigured = useConfigStore(state => state.isConfigured());
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
