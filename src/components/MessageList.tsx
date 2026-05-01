import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  viewportHeight?: string;
}

export default function MessageList({ messages, isTyping, viewportHeight }: MessageListProps) {
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
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl shadow-black/20">
            <Bot className="w-10 h-10 stroke-[1.2] text-blue-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-bold text-[var(--text-main)] italic tracking-tight">OLLAMA<span className="text-[var(--accent)]">LAB</span></p>
            <p className="text-sm font-medium text-neutral-500 max-w-xs">Start a high-performance session with your local AI instance</p>
          </div>
        </div>
      )}
      
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <MessageItem key={index} message={message} />
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2 max-w-3xl mx-auto items-start"
          >
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-blue-500" />
            </div>
            <div className="w-[90%] pt-2 space-y-2">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col gap-2 max-w-3xl mx-auto group",
        !isAssistant && "items-end"
      )}
    >
      <div 
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all border",
          isAssistant 
           ? "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-[var(--accent)]" 
           : "bg-[var(--accent-bg)] border-[var(--accent-bg)] text-[var(--accent-text)] shadow-lg"
        )}
      >
        {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      
      <div className={cn(
        "space-y-2",
        isAssistant ? "w-[90%]" : "w-full flex flex-col items-end"
      )}>
        <div className={cn(
          "relative p-5 rounded-2xl transition-all w-full",
          isAssistant 
            ? "bg-[var(--surface)] border border-[var(--surface-border)] shadow-xl shadow-black/5" 
            : "bg-blue-600/10 dark:bg-blue-600/20 border border-blue-500/30 text-[var(--text-main)] transition-colors text-right"
        )}>
          {message.images && message.images.length > 0 && (
            <div className={cn("flex flex-wrap gap-2 mb-4", !isAssistant && "justify-end")}>
              {message.images.map((img, i) => (
                <img 
                  key={i} 
                  src={`data:image/jpeg;base64,${img}`} 
                  alt="Attached" 
                  className="max-w-[200px] max-h-[200px] rounded-lg border border-[var(--surface-border)] object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          )}
          <div className={cn("markdown-body", !isAssistant && "text-right")}>
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="relative group/code my-4">
                      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          }}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={atomDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-xl !bg-neutral-900 !p-4 border border-white/5"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
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
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={saveToFile}
                className="p-1.5 rounded-lg transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-[var(--text-main)] border border-black/5 dark:border-white/5"
                title="Save as markdown file"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={copyToClipboard}
                className="p-1.5 rounded-lg transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-[var(--text-main)] border border-black/5 dark:border-white/5"
                title="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-2 px-1",
          !isAssistant && "justify-end"
        )}>
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isAssistant && <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500">Sent</span>}
        </div>
      </div>
    </motion.div>
  );
}
