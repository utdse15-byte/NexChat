import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { sanitizeMarkdown } from '../../core/markdown/sanitize';

type CodeProps = ComponentProps<'code'>;

export default function MarkdownRenderer({ content }: { content: string }) {
  const safeContent = sanitizeMarkdown(content);

  return (
    <div className="prose prose-invert prose-slate max-w-none w-full wrap-break-word prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          /**
           * react-markdown v10 已移除 `inline` 属性。
           * 围栏代码块（```lang）的 className 会包含 `language-*`，且其父节点是 <pre>。
           * 行内代码（`code`）则没有 language 类。
           */
          code({ className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            const value = String(children ?? '').replace(/\n$/, '');

            if (match) {
              return <CodeBlock language={match[1]} value={value} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-300 font-mono text-sm before:content-[''] after:content-['']"
                {...props}
              >
                {children}
              </code>
            );
          },
          /** 让 <pre> 直接渲染子节点（CodeBlock 已自带容器） */
          pre({ children }) {
            return <>{children}</>;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                <table className="min-w-full divide-y divide-white/10 m-0">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-slate-800/50 px-4 py-2 text-left text-sm font-semibold text-slate-200">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-4 py-2 text-sm border-t border-white/5">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/30 underline-offset-4 transition-colors"
              >
                {children}
              </a>
            );
          },
          img({ alt }) {
            return (
              <span className="text-slate-400 italic text-sm border border-white/10 rounded px-2 py-1 bg-slate-800/50 inline-block my-2">
                [图片: {alt || '未命名'}]
              </span>
            );
          },
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
