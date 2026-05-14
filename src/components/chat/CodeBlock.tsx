import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#1E1E1E]">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-white/5 text-xs text-slate-400">
        <span className="font-mono">{language || 'text'}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? (
             <><CheckOutlined className="text-emerald-400" /> <span className="text-emerald-400">已复制</span></>
          ) : (
            <><CopyOutlined /> <span>复制</span></>
          )}
        </button>
      </div>
      <div className="p-0 text-sm overflow-x-auto custom-scrollbar">
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
          wrapLines={true}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
