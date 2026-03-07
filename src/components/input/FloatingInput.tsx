import { useState } from 'react';
import ChatTextarea from './ChatTextarea';
import SendButton from './SendButton';
import { useConfigGuard } from '../../hooks/useConfigGuard';
import { useChatStream } from '../../hooks/useChatStream';
import ConfigGuardModal from '../feedback/ConfigGuardModal';
import { useUIStore } from '../../domain/ui/uiStore';

export default function FloatingInput() {
  const [input, setInput] = useState('');
  const { checkConfig, showConfigModal, setShowConfigModal } = useConfigGuard();
  const { sendMessage, stopGeneration, isStreaming } = useChatStream();
  const setIsSettingsOpen = useUIStore(state => state.setIsSettingsOpen);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    if (!checkConfig()) return;
    
    const content = input;
    setInput('');
    sendMessage(content);
  };

  return (
    <>
      <div className="relative flex items-end w-full bg-white/3 backdrop-blur-2xl border border-white/8 shadow-2xl shadow-black/40 rounded-2xl p-2 focus-within:bg-white/5 transition-colors">
        <ChatTextarea 
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={false}
        />
        <SendButton 
          isStreaming={isStreaming}
          disabled={!input.trim() && !isStreaming}
          onSend={handleSend}
          onStop={stopGeneration}
        />
      </div>
      
      <ConfigGuardModal 
        open={showConfigModal} 
        onClose={() => setShowConfigModal(false)}
        onOpenSettings={() => {
          setShowConfigModal(false);
          setIsSettingsOpen(true);
        }}
      />
    </>
  );
}
