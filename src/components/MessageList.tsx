import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
            <p className="text-lg font-bold text-slate-900 dark:text-white italic tracking-tight">OLLAMA<span className="text-blue-500">LAB</span></p>
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
            className="flex gap-4 max-w-3xl mx-auto items-start"
          >
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 pt-3.5 space-y-2">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-4 max-w-3xl mx-auto group",
        !isAssistant && "flex-row-reverse"
      )}
    >
      <div 
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all border",
          isAssistant 
           ? "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-blue-600 dark:text-blue-500" 
           : "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
        )}
      >
        {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      
      <div className={cn(
        "flex-1 space-y-2 max-w-[calc(100%-3rem)]",
        !isAssistant && "text-right"
      )}>
        <div className={cn(
          "relative p-5 rounded-2xl transition-all",
          isAssistant 
            ? "bg-white/40 dark:bg-white/[0.05] border border-black/5 dark:border-white/10 shadow-xl shadow-black/5" 
            : "bg-blue-600/10 dark:bg-blue-600/20 border border-blue-500/30 text-slate-800 dark:text-white"
        )}>
          <div className="markdown-body">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          
          {isAssistant && message.content && (
            <button
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-black/5 dark:border-white/5"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
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
