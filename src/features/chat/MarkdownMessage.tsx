import { Children, isValidElement, memo, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { clsx } from 'clsx'
import { Check, Copy } from 'lucide-react'

interface MarkdownMessageProps {
  content: string
  /** Renders a blinking caret after the last block, for streaming responses. */
  streaming?: boolean
}

function textFromNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textFromNode).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromNode(node.props.children)
  return ''
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // The Clipboard API is unavailable on insecure origins.
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-odin-graphite-800 bg-odin-black/70">
      <div className="flex items-center justify-between gap-2 border-b border-odin-graphite-800 bg-odin-surface-elevated/80 px-3 py-1.5">
        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-odin-graphite-500">
          {language || 'código'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-odin-graphite-400 transition-colors hover:bg-odin-graphite-800/60 hover:text-odin-orange-300"
          title="Copiar bloco de código"
          aria-label="Copiar bloco de código"
        >
          {copied ? (
            <Check className="h-3 w-3 text-odin-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[12.5px] leading-relaxed">
        <code className="font-mono text-odin-graphite-200">{code}</code>
      </pre>
    </div>
  )
}

const components: Components = {
  pre: ({ children }) => {
    const first = Children.toArray(children)[0]
    if (!isValidElement<{ className?: string; children?: ReactNode }>(first)) {
      return <pre className="overflow-x-auto">{children}</pre>
    }

    const language = /language-([\w+#-]+)/.exec(first.props.className || '')?.[1]
    const code = textFromNode(first.props.children).replace(/\n$/, '')
    return <CodeBlock code={code} language={language} />
  },
  code: ({ children }) => (
    <code className="rounded border border-odin-graphite-800 bg-odin-surface-elevated px-1 py-0.5 font-mono text-[0.85em] text-odin-orange-300">
      {children}
    </code>
  ),
  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-base font-semibold tracking-tight text-odin-graphite-50 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-4 text-[15px] font-semibold tracking-tight text-odin-graphite-50 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3 text-sm font-semibold text-odin-graphite-50 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1 mt-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-odin-graphite-300 first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="mb-1 mt-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-odin-graphite-300 first:mt-0">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="mb-1 mt-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-odin-graphite-400 first:mt-0">
      {children}
    </h6>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-odin-graphite-50">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => (
    <del className="text-odin-graphite-500 line-through">{children}</del>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-words text-odin-cyan-300 underline decoration-odin-cyan-300/40 underline-offset-2 transition-colors hover:text-odin-cyan-200"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-odin-orange-400">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-odin-orange-400">{children}</ol>
  ),
  li: ({ children, className }) => (
    <li
      className={clsx(
        'pl-0.5',
        String(className || '').includes('task-list-item') && '-ml-5 list-none'
      )}
    >
      {children}
    </li>
  ),
  input: ({ checked }) => (
    <span
      className={clsx(
        'mr-1.5 inline-block font-mono text-sm leading-none',
        checked ? 'text-odin-emerald-400' : 'text-odin-graphite-400'
      )}
      aria-hidden="true"
    >
      {checked ? '☑' : '☐'}
    </span>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-r-lg border-l-2 border-odin-orange-500/60 bg-odin-surface-elevated/40 py-1.5 pl-3 pr-2 italic text-odin-graphite-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-odin-graphite-800" />,
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt || ''}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="my-2 max-h-96 max-w-full rounded-lg border border-odin-graphite-800 object-contain"
    />
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-odin-graphite-800">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children, style }) => (
    <th
      style={style}
      className="whitespace-nowrap border-b border-odin-graphite-800 bg-odin-surface-elevated/80 px-2.5 py-1.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-odin-graphite-300"
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td
      style={style}
      className="border-b border-odin-graphite-800/60 px-2.5 py-1.5 align-top text-odin-graphite-200"
    >
      {children}
    </td>
  ),
}

function MarkdownMessageInner({ content, streaming = false }: MarkdownMessageProps) {
  return (
    <div
      className={clsx(
        'odin-markdown break-words font-sans text-sm leading-relaxed text-odin-graphite-100 selection:bg-odin-orange-500/30',
        streaming && 'odin-streaming'
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export const MarkdownMessage = memo(MarkdownMessageInner)
