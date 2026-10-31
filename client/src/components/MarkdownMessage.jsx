import { useState } from 'react';
import styles from './MarkdownMessage.module.css';

function CodeSnippet({ code, language }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>{language || 'code'}</span>
        <button
          className={styles.copyBtn}
          onClick={handleCopy}
          type="button"
          aria-label="Copy code snippet"
        >
          {copied ? 'copied! ✓' : 'copy'}
        </button>
      </div>
      <pre className={styles.pre}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text) {
  // Parses **bold**, `code`, and plain text
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for bold **text**
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      parts.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for inline code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(<code key={key++} className={styles.inlineCode}>{codeMatch[1]}</code>);
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Regular text up to the next special char
    const nextSpecial = remaining.search(/(\*\*|__|`)/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Just a stray char, advance 1
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

export default function MarkdownMessage({ content }) {
  if (!content) return null;

  // Split content by code blocks first
  const blocks = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      language: match[1]?.trim() || 'shell',
      code: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return (
    <div className={styles.container}>
      {blocks.map((block, blockIdx) => {
        if (block.type === 'code') {
          return (
            <CodeSnippet
              key={blockIdx}
              language={block.language}
              code={block.code}
            />
          );
        }

        // Parse text blocks by lines
        const lines = block.value.split('\n');
        const elements = [];
        let currentList = null;

        function flushList() {
          if (currentList) {
            if (currentList.type === 'ol') {
              elements.push(
                <ol key={`ol-${elements.length}`} className={styles.ol}>
                  {currentList.items.map((it, idx) => (
                    <li key={idx}>{renderInline(it)}</li>
                  ))}
                </ol>
              );
            } else {
              elements.push(
                <ul key={`ul-${elements.length}`} className={styles.ul}>
                  {currentList.items.map((it, idx) => (
                    <li key={idx}>{renderInline(it)}</li>
                  ))}
                </ul>
              );
            }
            currentList = null;
          }
        }

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {
            flushList();
            continue;
          }

          // Heading ###
          if (line.startsWith('### ')) {
            flushList();
            elements.push(<h4 key={i} className={styles.h4}>{renderInline(line.slice(4))}</h4>);
            continue;
          }
          if (line.startsWith('## ')) {
            flushList();
            elements.push(<h3 key={i} className={styles.h3}>{renderInline(line.slice(3))}</h3>);
            continue;
          }
          if (line.startsWith('# ')) {
            flushList();
            elements.push(<h2 key={i} className={styles.h2}>{renderInline(line.slice(2))}</h2>);
            continue;
          }

          // Ordered list: "1. ", "2. ", etc.
          const olMatch = line.match(/^(\d+)\.\s+(.*)/);
          if (olMatch) {
            if (!currentList || currentList.type !== 'ol') {
              flushList();
              currentList = { type: 'ol', items: [] };
            }
            currentList.items.push(olMatch[2]);
            continue;
          }

          // Unordered list: "- ", "* "
          const ulMatch = line.match(/^[-*]\s+(.*)/);
          if (ulMatch) {
            if (!currentList || currentList.type !== 'ul') {
              flushList();
              currentList = { type: 'ul', items: [] };
            }
            currentList.items.push(ulMatch[1]);
            continue;
          }

          // Regular paragraph line
          flushList();
          elements.push(
            <p key={i} className={styles.p}>
              {renderInline(line)}
            </p>
          );
        }

        flushList();
        return <div key={blockIdx} className={styles.textBlock}>{elements}</div>;
      })}
    </div>
  );
}

