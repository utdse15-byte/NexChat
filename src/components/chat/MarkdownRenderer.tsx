import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { sanitizeMarkdown } from '../../core/markdown/sanitize';

export default function MarkdownRenderer({ content }: { content: string }) {
  const safeContent = sanitizeMarkdown(content);

  return (
    <div className="prose prose-invert prose-slate max-w-none w-full wrap-break-word prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const StringContent = String(children).replace(/\n$/, '');
            
            if (!inline) {
              return (
                <CodeBlock 
                  language={match ? match[1] : ''} 
                  value={StringContent} 
                />
              );
            }
            
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-300 font-mono text-sm before:content-[''] after:content-['']" {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                <table className="min-w-full divide-y divide-white/10 m-0">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-slate-800/50 px-4 py-2 text-left text-sm font-semibold text-slate-200">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 text-sm border-t border-white/5">{children}</td>;
          },
          a({ href, children }) {
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/30 underline-offset-4 transition-colors">{children}</a>;
          },
          img({ alt }) {
            return <span className="text-slate-400 italic text-sm border border-white/10 rounded px-2 py-1 bg-slate-800/50 inline-block my-2">[图片: {alt || '未命名'}]</span>;
          }
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
