import React from 'react';
import { Send, Hash } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  selectedModel?: string;
}

export default function ChatInput({ onSend, disabled, selectedModel }: ChatInputProps) {
  const [input, setInput] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-8 pt-2 relative z-20">
      <div className="relative flex flex-col gap-2 p-2 bg-[var(--surface)] backdrop-blur-xl rounded-2xl border border-[var(--surface-border)] shadow-2xl shadow-black/40 ring-1 ring-white/5 transition-colors">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--surface-border)] hidden md:flex">
          <Hash className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-neutral-500 dark:text-neutral-400">
            {selectedModel || 'Select a model to begin'}
          </span>
        </div>
        
        <div className="flex items-end gap-2 pr-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ollama anything..."
            className="flex-1 w-full bg-transparent px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none resize-none placeholder:text-neutral-500 min-h-[44px] max-h-[200px] transition-colors"
            disabled={disabled}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || disabled}
            className={cn(
              "p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 mb-1.5",
              input.trim() && !disabled 
                ? "bg-[var(--accent-bg)] text-[var(--accent-text)] hover:opacity-80 translate-y-[-1px] shadow-lg shadow-black/10 active:translate-y-0" 
                : "bg-black/5 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border border-black/5 dark:border-white/5"
            )}
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-3">
        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest opacity-60">
          Shift + Enter for new line
        </p>
        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest opacity-60">
          Local Engine Required
        </p>
      </div>
    </div>
  );
}
