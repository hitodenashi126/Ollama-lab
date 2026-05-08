import React from 'react';
import { Send, Hash, Paperclip, X, FileText, ChevronDown, Plus, Square } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileAttachment, OllamaModel } from '../types';
import { toast } from 'sonner';

interface ChatInputProps {
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
  selectedModel?: string;
  models: OllamaModel[];
  onSelectModel: (model: string) => void;
  onStop?: () => void;
  isTyping?: boolean;
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  content: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TEXT_TYPES = [
  '.txt', '.md', '.c', '.cpp', '.h', '.py', '.js', '.ts', '.tsx', 
  '.html', '.css', '.json', '.java', '.go', '.rs', '.php', '.rb', 
  '.sh', '.yaml', '.yml', '.sql'
];

export default function ChatInput({ 
  onSend, 
  disabled, 
  selectedModel, 
  models, 
  onSelectModel,
  onStop,
  isTyping 
}: ChatInputProps) {
  const [input, setInput] = React.useState('');
  const [attachedFiles, setAttachedFiles] = React.useState<AttachedFile[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !disabled) {
      const attachments: FileAttachment[] = attachedFiles.map(f => ({
        name: f.name,
        content: f.content
      }));

      onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachedFiles([]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large. Max size is 5MB.`);
        continue;
      }

      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isText = ALLOWED_TEXT_TYPES.includes(extension) || file.type.startsWith('text/');

      if (!isText) {
        toast.error(`File type ${extension} is not supported. Please upload text, code, or markdown files.`);
        continue;
      }

      const reader = new FileReader();
      reader.readAsText(file);

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
    // Sending on Enter disabled as per user request
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-safe md:pb-8 pt-2 relative z-20">
      <div className="mb-4 sm:mb-0 relative flex flex-col bg-[var(--surface)] backdrop-blur-xl rounded-2xl border border-[var(--surface-border)] shadow-2xl shadow-black/40 ring-1 ring-white/5 transition-colors overflow-hidden">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-[var(--surface-border)] bg-black/[0.02] dark:bg-white/[0.02]">
            {attachedFiles.map((file, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg px-2 py-1 text-[10px] font-medium animate-fade-in"
              >
                <FileText className="w-3 h-3 text-neutral-400" />
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
        
        <div className="flex flex-col">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTyping ? "Copilot is responding..." : "Ask Ollama anything..."}
            className="w-full bg-transparent px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none resize-none placeholder:text-neutral-500 min-h-[60px] max-h-[200px] transition-colors"
            disabled={disabled}
          />

          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 text-neutral-500 hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all"
                title="Search"
              >
                <Hash className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-neutral-500 hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all"
                title="Knowledge Base"
              >
                <FileText className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 bg-[var(--surface-border)] mx-1" />

              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept={ALLOWED_TEXT_TYPES.join(',')}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-1.5 text-neutral-500 hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all active:scale-90"
                title="Attach files"
              >
                <Plus className="w-4 h-4" />
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-neutral-500 hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all active:scale-95"
                >
                  <span>{selectedModel || 'Select Model'}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isModelDropdownOpen && "rotate-180")} />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl shadow-xl py-1 z-50 animate-scale-in">
                    {models.length > 0 ? (
                      models.map((model) => (
                        <button
                          key={model.name}
                          onClick={() => {
                            onSelectModel(model.name);
                            setIsModelDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-[11px] transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between",
                            selectedModel === model.name ? "text-[var(--accent)] bg-[var(--accent)]/5" : "text-neutral-500"
                          )}
                        >
                          <span className="truncate">{model.name}</span>
                          {selectedModel === model.name && <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-[11px] text-neutral-500 italic">No models found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isTyping ? (
                <button
                  onClick={onStop}
                  className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all active:scale-90"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit()}
                  disabled={(!input.trim() && attachedFiles.length === 0) || disabled}
                  className={cn(
                    "p-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 active:scale-90",
                    (input.trim() || attachedFiles.length > 0) && !disabled 
                      ? "bg-[var(--accent-bg)] text-[var(--accent-text)] hover:opacity-80 translate-y-[-1px] shadow-lg shadow-black/10 active:translate-y-0" 
                      : "bg-black/5 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border border-black/5 dark:border-white/5"
                  )}
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
