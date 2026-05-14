/**
 * RAG 引用来源展示组件
 * 在 AI 回答下方折叠展示引用的知识库文档片段
 */
import { useState } from 'react';

interface Source {
  content: string;
  document_name: string;
  relevance: number;
  chunk_index: number;
}

export default function SourcesDisplay({ sources }: { sources: Source[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-cyan-400/80 hover:text-cyan-400 transition-colors cursor-pointer"
      >
        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>引用来源 ({sources.length})</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {sources.map((source, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/5 bg-slate-800/50 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-cyan-400 font-medium">
                  📄 {source.document_name}
                </span>
                <span className="text-slate-500">
                  相关度 {(source.relevance * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-slate-400 line-clamp-3 leading-relaxed">
                {source.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
