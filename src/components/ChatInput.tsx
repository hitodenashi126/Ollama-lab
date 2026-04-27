import React from 'react';
import { Send, Hash, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void;
  disabled?: boolean;
  selectedModel?: string;
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  content: string; // base64 for images, text content for text files
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TEXT_TYPES = ['.txt', '.js', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.md'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ChatInput({ onSend, disabled, selectedModel }: ChatInputProps) {
  const [input, setInput] = React.useState('');
  const [attachedFiles, setAttachedFiles] = React.useState<AttachedFile[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !disabled) {
      let finalMessage = input.trim();
      const images: string[] = [];

      attachedFiles.forEach(file => {
        if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
          // Remove the data:image/...;base64, prefix for Ollama
          const base64 = file.content.split(',')[1];
          if (base64) images.push(base64);
        } else {
          finalMessage += `\n\n--- File: ${file.name} ---\n${file.content}\n--- End of File ---\n`;
        }
      });

      onSend(finalMessage, images.length > 0 ? images : undefined);
      setInput('');
      setAttachedFiles([]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Max size is 5MB.`);
        continue;
      }

      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isText = ALLOWED_TEXT_TYPES.includes(extension) || file.type.startsWith('text/');

      if (!isImage && !isText) {
        alert(`File type ${extension} is not supported.`);
        continue;
      }

      const reader = new FileReader();
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }

      reader.onload = (event) => {
        const content = event.target?.result as string;
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          content
        }]);
      };
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-[var(--surface-border)]">
            {attachedFiles.map((file, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg px-2 py-1 text-[10px] font-medium"
              >
                {ALLOWED_IMAGE_TYPES.includes(file.type) ? (
                  <ImageIcon className="w-3 h-3 text-blue-500" />
                ) : (
                  <FileText className="w-3 h-3 text-neutral-400" />
                )}
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button 
                  onClick={() => removeFile(i)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2 pr-2">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept={[...ALLOWED_TEXT_TYPES, ...ALLOWED_IMAGE_TYPES].join(',')}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2.5 text-neutral-500 hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all mb-1.5 shrink-0"
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          
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
            disabled={(!input.trim() && attachedFiles.length === 0) || disabled}
            className={cn(
              "p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 mb-1.5",
              (input.trim() || attachedFiles.length > 0) && !disabled 
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
