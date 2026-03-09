import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

export default function MarkdownRenderer({ content, className = "" }) {
  return (
    <div className={`markdown-body ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .markdown-body .katex-display { margin: 1em 0; overflow-x: auto; color: #f8fafc; }
        .markdown-body .katex { font-size: 1.1em; color: #38bdf8; }
        .markdown-body .md-paragraph { white-space: pre-wrap; margin-bottom: 1em; }
        
        /* Reset background for the highlighter container */
        .markdown-body pre { background: none !important; padding: 0 !important; border: none !important; margin: 0 !important; }
        
        /* 🚀 SAFE ZONE: Nuke styles inside highlighter */
        .sh-wrapper code {
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
          color: inherit !important;
        }
      `}} />

      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          p({ node, children, ...props }) {
            return <div className="md-paragraph" {...props}>{children}</div>;
          },
          pre({ children }) { return <>{children}</>; },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const contentString = String(children).replace(/\n$/, '');
            const isBlock = match || contentString.includes('\n');

            if (isBlock) {
              return (
                <div className="sh-wrapper">
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match ? match[1] : 'text'}
                    PreTag="div"
                    wrapLongLines={true}
                    customStyle={{
                      backgroundColor: '#020617',
                      padding: '1rem',
                      margin: '1.5rem 0',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      fontSize: '0.85rem'
                    }}
                    {...props}
                  >
                    {contentString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            // 🚀 USE A SPECIFIC CLASS
            return (
              <code className="inline-code-badge" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content || "*No description provided yet.*"}
      </ReactMarkdown>
    </div>
  );
}