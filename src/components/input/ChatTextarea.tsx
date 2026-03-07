import React, { useRef, useEffect } from 'react';

interface ChatTextareaProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatTextarea({ value, onChange, onSend, disabled }: ChatTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
      textareaRef.current.style.overflowY = scrollHeight > 150 ? 'auto' : 'hidden';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.key === 'Process') return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className="w-full max-h-[150px] min-h-[44px] bg-transparent resize-none outline-none text-slate-100 px-3 py-3 leading-6 scrollbar-hide"
      placeholder="发送消息... (Enter 发送，Shift+Enter 换行)"
      rows={1}
    />
  );
}
