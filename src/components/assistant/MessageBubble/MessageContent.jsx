import { useState } from 'react';

/**
 * Highlight occurrences of `query` in `text` with a <mark> element.
 */
function highlightText(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/**
 * Renders message content with basic markdown support.
 * Supports: **bold**, *italic*, `inline code`, ```code blocks```, [links](url), bullet lists
 *
 * Props:
 * - content: string
 * - isUser: boolean
 * - highlightQuery: string (optional) — highlights matching text
 */
export default function MessageContent({ content, isUser, highlightQuery }) {
  // Split content into code blocks and regular text
  const parts = parseContent(content);

  return (
    <div className="text-sm leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return <CodeBlock key={i} code={part.content} language={part.language} />;
        }
        return <TextBlock key={i} text={part.content} isUser={isUser} highlightQuery={highlightQuery} />;
      })}
    </div>
  );
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="relative my-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {language && (
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3 py-1.5">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{language}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] font-medium text-slate-500 hover:text-primary transition-colors"
            aria-label="Copy code"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto bg-slate-50 dark:bg-slate-900 p-3 text-xs font-mono text-slate-800 dark:text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TextBlock({ text, isUser, highlightQuery }) {
  // Render inline markdown: bold, italic, inline code, links, bullet lists
  const lines = text.split('\n');

  return (
    <div>
      {lines.map((line, i) => {
        // Bullet list item
        if (line.match(/^[-*]\s/)) {
          return (
            <div key={i} className="flex gap-2 my-0.5">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60" />
              <span>{renderInline(line.replace(/^[-*]\s/, ''), isUser, highlightQuery)}</span>
            </div>
          );
        }
        // Numbered list
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)[1];
          return (
            <div key={i} className="flex gap-2 my-0.5">
              <span className="flex-shrink-0 opacity-60 text-xs mt-0.5">{num}.</span>
              <span>{renderInline(line.replace(/^\d+\.\s/, ''), isUser, highlightQuery)}</span>
            </div>
          );
        }
        // Empty line = paragraph break
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return <div key={i}>{renderInline(line, isUser, highlightQuery)}</div>;
      })}
    </div>
  );
}

function renderInline(text, isUser, highlightQuery) {
  // Process inline markdown: **bold**, *italic*, `code`, [text](url)
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
    // Italic: *text*
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*(.*)/s);
    // Inline code: `code`
    const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)/s);
    // Link: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[(.+?)\]\((https?:\/\/[^\s)]+)\)(.*)/s);

    // Find the earliest match
    const matches = [
      boldMatch && { type: 'bold', match: boldMatch, pos: boldMatch[1].length },
      italicMatch && { type: 'italic', match: italicMatch, pos: italicMatch[1].length },
      codeMatch && { type: 'code', match: codeMatch, pos: codeMatch[1].length },
      linkMatch && { type: 'link', match: linkMatch, pos: linkMatch[1].length },
    ].filter(Boolean).sort((a, b) => a.pos - b.pos);

    if (matches.length === 0) {
      parts.push(<span key={key++}>{highlightQuery ? highlightText(remaining, highlightQuery) : remaining}</span>);
      break;
    }

    const first = matches[0];
    const [, before, content, after] = first.match;

    if (before) parts.push(<span key={key++}>{highlightQuery ? highlightText(before, highlightQuery) : before}</span>);

    if (first.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold">{renderInline(content, isUser, highlightQuery)}</strong>);
    } else if (first.type === 'italic') {
      parts.push(<em key={key++} className="italic">{renderInline(content, isUser, highlightQuery)}</em>);
    } else if (first.type === 'code') {
      parts.push(
        <code
          key={key++}
          className={`rounded px-1 py-0.5 text-xs font-mono ${
            isUser
              ? 'bg-white/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {content}
        </code>
      );
    } else if (first.type === 'link') {
      const url = first.match[3];
      parts.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline ${isUser ? 'text-white/90' : 'text-primary'}`}
        >
          {content}
        </a>
      );
    }

    remaining = after || '';
  }

  return <>{parts}</>;
}

function parseContent(content) {
  const parts = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: match[1] || '', content: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }];
}
