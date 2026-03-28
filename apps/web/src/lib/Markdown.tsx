import { marked } from 'marked'
import { useMemo } from 'react'

marked.setOptions({ gfm: true, breaks: true })

export function Markdown({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => marked.parse(text.trim() || '') as string, [text])
  return (
    <div
      className={className ? `md ${className}` : 'md'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
