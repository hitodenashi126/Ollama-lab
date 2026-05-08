import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LabIcon } from './LabIcon';
import { User, Copy, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  viewportHeight?: string;
  chatStyle?: 'boxed' | 'unboxed';
  showTimestamp?: boolean;
}

export default function MessageList({ messages, isTyping, viewportHeight, chatStyle = 'boxed', showTimestamp }: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, viewportHeight]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth z-10"
    >
      {messages.length === 0 && !isTyping && (
        <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-6">
          <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl shadow-black/20">
            <LabIcon size={40} className="text-[var(--accent)]" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-bold text-[var(--text-main)] italic tracking-tight">OLLAMA<span className="text-[var(--accent)]">LAB</span></p>
            <p className="text-sm font-medium text-neutral-500 max-w-xs">Start a high-performance session with your local AI instance</p>
          </div>
        </div>
      )}
      
      {messages.map((message, index) => (
        <MessageItem 
          key={index} 
          message={message} 
          chatStyle={chatStyle} 
          showTimestamp={showTimestamp} 
        />
      ))}
      
      {isTyping && (
        <div className="flex flex-col gap-2 max-w-3xl mx-auto items-start animate-slide-in-bottom">
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <LabIcon size={20} className="text-[var(--accent)]" />
          </div>
          <div className="w-[90%] pt-2 space-y-2">
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageItem({ 
  message, 
  chatStyle, 
  showTimestamp 
}: { 
  message: Message; 
  chatStyle: 'boxed' | 'unboxed'; 
  showTimestamp?: boolean; 
}) {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToFile = () => {
    const blob = new Blob([message.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response_${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 max-w-3xl mx-auto group animate-slide-in-bottom",
        !isAssistant && "items-end"
      )}
    >
      <div 
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all border",
          isAssistant 
           ? "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-[var(--accent)]" 
           : "bg-[var(--accent-bg)] border-[var(--accent-bg)] text-[var(--accent-text)] shadow-lg"
        )}
      >
        {isAssistant ? <LabIcon size={20} /> : <User className="w-5 h-5" />}
      </div>
      
        <div className={cn(
          "space-y-2 w-full",
          isAssistant ? "md:max-w-[90%]" : "flex flex-col items-end"
        )}>
          {chatStyle === 'boxed' ? (
            <div className={cn(
              "relative p-5 rounded-xl transition-all w-full",
              isAssistant 
                ? "bg-[var(--surface)] border border-[var(--surface-border)] shadow-xl shadow-black/5" 
                : "bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-600/20 text-right"
            )}>
              <div className={cn("markdown-body", !isAssistant && "text-right text-white")}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');
                      return !inline && match ? (
                        <div className="relative group/code my-4">
                          <div className="absolute right-2 top-2 z-10 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/code:opacity-100 transition-opacity">
                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{match[1]}</span>
                            <Tooltip content="Copy Code" position="top">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(codeContent);
                                  toast.success('Code copied to clipboard');
                                }}
                                className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors active:scale-95 border border-white/5"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                          <SyntaxHighlighter
                            style={atomDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !bg-neutral-900 !p-4 border border-white/5"
                            {...props}
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className={cn("bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm", className)} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              
              {isAssistant && message.content && (
                <div className="mt-4 pt-3 border-t border-[var(--surface-border)] flex items-center gap-3">
                  <Tooltip content="Copy Response" position="top">
                    <button
                      onClick={() => {
                        copyToClipboard();
                        toast.success('Response copied to clipboard');
                      }}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-all active:scale-95"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </Tooltip>
                  <Tooltip content="Save as Markdown" position="top">
                    <button
                      onClick={() => {
                        saveToFile();
                        toast.success('Response saved as markdown');
                      }}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-all active:scale-95"
                    >
                      <Save className="w-3 h-3" />
                      Export
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          ) : (
            <div className={cn("w-full py-2", !isAssistant && "text-right")}>
               <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');
                      return !inline && match ? (
                        <div className="relative group/code my-4">
                          <div className="absolute right-2 top-2 z-10 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/code:opacity-100 transition-opacity">
                             <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{match[1]}</span>
                            <Tooltip content="Copy Code" position="top">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(codeContent);
                                  toast.success('Code copied to clipboard');
                                }}
                                className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors active:scale-95 border border-white/5"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                          <SyntaxHighlighter
                            style={atomDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !bg-neutral-900 !p-4 border border-white/5"
                            {...props}
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className={cn("bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm", className)} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              
              {isAssistant && message.content && (
                <div className="flex items-center gap-4 mt-3">
                  <Tooltip content="Copy Response" position="bottom">
                    <button
                      onClick={() => {
                        copyToClipboard();
                        toast.success('Response copied to clipboard');
                      }}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-colors active:scale-95"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </Tooltip>
                  <Tooltip content="Save as Markdown" position="bottom">
                    <button
                      onClick={() => {
                        saveToFile();
                        toast.success('Response saved as markdown');
                      }}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-colors active:scale-95"
                    >
                      <Save className="w-3 h-3" />
                      Export
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          )}
          
          <div className={cn(
            "flex items-center gap-2 px-1",
            !isAssistant && "justify-end"
          )}>
            {showTimestamp && (
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {!isAssistant && <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500">Sent</span>}
          </div>
        </div>
    </div>
  );
}
