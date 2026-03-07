import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
  compact?: boolean; // for card previews — tighter line-height and smaller font
}

/**
 * Renders AI-generated markdown content cleanly.
 * Use compact=true inside cards, default for full-view panels.
 */
export default function MarkdownContent({ content, className = "", compact = false }: MarkdownContentProps) {
  const base = compact
    ? "text-sm text-gray-700 leading-relaxed"
    : "text-[15px] text-gray-800 leading-7";

  return (
    <div className={`markdown-body ${base} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className={`font-black text-gray-900 mt-4 mb-2 ${compact ? "text-base" : "text-xl"}`}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={`font-black text-gray-900 mt-3 mb-1.5 ${compact ? "text-sm" : "text-lg"}`}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={`font-extrabold text-gray-800 mt-2 mb-1 ${compact ? "text-xs" : "text-base"}`}>{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-black text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-indigo-700 not-italic font-semibold">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className={`my-2 space-y-1 ${compact ? "pl-4" : "pl-5"}`}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={`my-2 space-y-1 ${compact ? "pl-4" : "pl-5"} list-decimal`}>{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex gap-2 items-start text-gray-700">
              <span className="text-indigo-400 mt-0.5 shrink-0">·</span>
              <span>{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-300 pl-4 my-3 text-gray-600 bg-indigo-50/50 py-2 rounded-r-xl italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded-md text-xs font-mono font-bold">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-2xl overflow-x-auto text-xs my-3 font-mono">
              {children}
            </pre>
          ),
          hr: () => <hr className="border-gray-100 my-3" />,
          a: ({ href, children }) => (
            <a href={href} className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
