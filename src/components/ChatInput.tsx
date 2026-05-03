import React from 'react';
import { Send, Hash, Paperclip, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatInputProps {
  onSend: (message: string, files?: Array<{ name: string; content: string }>) => void;
  disabled?: boolean;
  selectedModel?: string;
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  status?: 'pending' | 'success' | 'error';
}

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
  duration: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
const MAX_FILES = 10;
const ALLOWED_TEXT_TYPES = ['.txt', '.js', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.md', '.cpp', '.c', '.java', '.rb', '.go', '.rs', '.sql'];
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/javascript',
  'text/typescript',
  'text/html',
  'text/css',
  'application/json',
  'text/markdown',
  'text/x-python',
  'text/x-c++src',
  'text/x-csrc',
];

export default function ChatInput({ onSend, disabled, selectedModel }: ChatInputProps) {
  const [input, setInput] = React.useState('');
  const [attachedFiles, setAttachedFiles] = React.useState<AttachedFile[]>([]);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Toast notification system
  const showToast = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Validate if file type is allowed
  const isAllowedFile = (file: File): { allowed: boolean; reason?: string } => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    // Check MIME type
    const mimeAllowed = ALLOWED_MIME_TYPES.some(mime => file.type.startsWith(mime.split('/')[0]) || file.type === mime);
    
    // Check extension
    const extAllowed = ALLOWED_TEXT_TYPES.includes(ext);
    
    if (!mimeAllowed && !extAllowed) {
      return {
        allowed: false,
        reason: `File type "${ext || 'unknown'}" is not supported. Supported: ${ALLOWED_TEXT_TYPES.join(', ')}`
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        allowed: false,
        reason: `File "${file.name}" exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
      };
    }

    return { allowed: true };
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !disabled && !isProcessingFiles) {
      const filesToSend = attachedFiles.map(file => ({
        name: file.name,
        content: file.content
      }));

      onSend(input.trim(), filesToSend.length > 0 ? filesToSend : undefined);
      setInput('');
      setAttachedFiles([]);
      showToast('Message sent successfully', 'success', 2000);
    }
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessingFiles(true);

    // Validate file count
    if (attachedFiles.length + files.length > MAX_FILES) {
      showToast(`Maximum ${MAX_FILES} files allowed. You can attach ${MAX_FILES - attachedFiles.length} more.`, 'warning');
      setIsProcessingFiles(false);
      return;
    }

    // Validate total size
    const totalSize = attachedFiles.reduce((sum, f) => sum + f.size, 0) +
                     files.reduce((sum, f) => sum + f.size, 0);

    if (totalSize > MAX_TOTAL_SIZE) {
      const maxMB = (MAX_TOTAL_SIZE / 1024 / 1024).toFixed(1);
      showToast(`Total file size exceeds ${maxMB}MB limit. Current: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'error');
      setIsProcessingFiles(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const validation = isAllowedFile(file);
      
      if (!validation.allowed) {
        showToast(validation.reason || `File "${file.name}" is not allowed`, 'error');
        errorCount++;
        continue;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          content,
          status: 'success'
        }]);
        successCount++;

        if (successCount + errorCount === files.length) {
          setIsProcessingFiles(false);
          if (successCount > 0) {
            showToast(`${successCount} file(s) added successfully`, 'success', 2000);
          }
        }
      };

      reader.onerror = () => {
        showToast(`Failed to read file: ${file.name}`, 'error');
        errorCount++;

        if (successCount + errorCount === files.length) {
          setIsProcessingFiles(false);
        }
      };

      reader.readAsText(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    showToast('File removed', 'info', 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Shift + Enter creates new line
    // Regular Enter is disabled per user request
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow default shift+enter behavior
      return;
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const totalFileSize = attachedFiles.reduce((sum, f) => sum + f.size, 0);
  const canAddMoreFiles = attachedFiles.length < MAX_FILES;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-safe md:pb-8 pt-2 relative z-20">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 pointer-events-none z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto px-4 py-3 rounded-lg backdrop-blur-xl border shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300',
              {
                'bg-red-500/20 border-red-500/30 text-red-200': toast.type === 'error',
                'bg-yellow-500/20 border-yellow-500/30 text-yellow-200': toast.type === 'warning',
                'bg-green-500/20 border-green-500/30 text-green-200': toast.type === 'success',
                'bg-blue-500/20 border-blue-500/30 text-blue-200': toast.type === 'info',
              }
            )}
          >
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {toast.message}
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-auto hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'mb-4 sm:mb-0 relative flex flex-col gap-2 p-2 bg-[var(--surface)] backdrop-blur-xl rounded-2xl border shadow-2xl shadow-black/40 ring-1 ring-white/10 transition-all duration-200',
          isDragOver && 'border-blue-500/50 bg-blue-500/5 shadow-blue-500/20'
        )}
        style={{
          borderColor: isDragOver ? 'var(--accent)' : 'var(--surface-border)',
        }}
      >
        {/* Model Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--surface-border)] hidden md:flex">
          <Hash className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-neutral-500 dark:text-neutral-400">
            {selectedModel || 'Select a model to begin'}
          </span>
        </div>

        {/* Attached Files Section */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-col gap-2 px-3 py-2 border-b border-[var(--surface-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-neutral-500">
                Files ({attachedFiles.length}/{MAX_FILES})
              </span>
              <span className="text-[9px] text-neutral-400">
                {(totalFileSize / 1024).toFixed(1)} KB / {(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)} MB
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg px-3 py-2 text-[10px] font-medium group hover:border-red-500/50 transition-all"
                >
                  <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="truncate max-w-[120px]" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[9px] text-neutral-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className="ml-auto flex-shrink-0 text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drag & Drop Indicator */}
        {isDragOver && (
          <div className="px-3 py-4 text-center border border-dashed border-blue-500/50 rounded-lg bg-blue-500/5">
            <p className="text-sm font-medium text-blue-400">Drop files here to upload</p>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2 pr-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept={[...ALLOWED_TEXT_TYPES, ...ALLOWED_MIME_TYPES].join(',')}
            disabled={!canAddMoreFiles}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || !canAddMoreFiles || isProcessingFiles}
            className={cn(
              'p-2.5 rounded-xl transition-all mb-1.5 shrink-0',
              canAddMoreFiles && !disabled && !isProcessingFiles
                ? 'text-neutral-500 hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                : 'text-neutral-600 opacity-50 cursor-not-allowed'
            )}
            title={canAddMoreFiles ? 'Attach files (text only)' : `Max ${MAX_FILES} files reached`}
          >
            <Paperclip className={cn('w-4 h-4', isProcessingFiles && 'animate-pulse')} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ollama anything... (Shift+Enter for new line)"
            className="flex-1 w-full bg-transparent px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none resize-none placeholder:text-neutral-500 min-h-[44px] max-h-[200px] transition-colors"
            disabled={disabled || isProcessingFiles}
          />
          
          <button
            onClick={() => handleSubmit()}
            disabled={(!input.trim() && attachedFiles.length === 0) || disabled || isProcessingFiles}
            className={cn(
              'p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 mb-1.5',
              (input.trim() || attachedFiles.length > 0) && !disabled && !isProcessingFiles
                ? 'bg-[var(--accent-bg)] text-[var(--accent-text)] hover:opacity-80 translate-y-[-1px] shadow-lg shadow-black/10 active:translate-y-0'
                : 'bg-black/5 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 cursor-not-allowed border border-black/5 dark:border-white/5'
            )}
            title="Send message"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-center gap-4 mt-3 flex-wrap">
        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest opacity-60">
          Shift + Enter for new line
        </p>
        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest opacity-60">
          Local Engine Required
        </p>
        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest opacity-60">
          Text Files Only
        </p>
      </div>
    </div>
  );
}
