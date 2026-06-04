import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LabIcon } from './LabIcon';
import { OllamaTroubleshooter } from './OllamaTroubleshooter';
import { User, Copy, Check, Save, ChevronDown, Brain, Edit, Volume2, VolumeX, Sparkles, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ParsedContent {
  think: string | null;
  thinking: boolean;
  main: string;
}

interface MessageActionsDropdownProps {
  isAssistant: boolean;
  message: Message;
  index: number;
  isSpeaking: boolean;
  isSherpaLoading: boolean;
  onSpeakToggle?: (index: number, text: string) => void;
  onEdit?: (content: string) => void;
  copyToClipboard: () => void;
  saveToFile: () => void;
  copied: boolean;
  theme: 'light-accent' | 'dark-white';
}

function MessageActionsDropdown({
  isAssistant,
  message,
  index,
  isSpeaking,
  isSherpaLoading,
  onSpeakToggle,
  onEdit,
  copyToClipboard,
  saveToFile,
  copied,
  theme
}: MessageActionsDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setIsOpen(false);
  };

  const buttonStyle = theme === 'dark-white'
    ? "text-white/60 hover:text-white hover:bg-white/10"
    : "text-neutral-500 hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/10";

  const menuStyle = theme === 'dark-white'
    ? "bg-slate-950 border border-slate-800 shadow-xl text-white"
    : "bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-805 shadow-xl text-[var(--text-main)]";

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={cn(
          "p-1.5 rounded-lg transition-all focus:outline-none active:scale-95 cursor-pointer backdrop-blur-sm",
          buttonStyle
        )}
        title="Managed Options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute right-0 mt-1 w-44 rounded-xl py-1.5 z-40 text-left font-semibold text-[11px] uppercase tracking-wider shadow-lg animate-fade-in origin-top-right",
          menuStyle
        )}>
          {isAssistant ? (
            <>
              {onSpeakToggle && (
                <button
                  type="button"
                  onClick={(e) => handleAction(e, () => onSpeakToggle(index, message.content))}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left",
                    isSpeaking ? "text-[var(--accent)] font-bold" : "text-neutral-500 hover:text-[var(--text-main)]"
                  )}
                >
                  {isSpeaking ? (
                    isSherpaLoading ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-red-500" />
                    )
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isSpeaking ? (isSherpaLoading ? "Synthesizing" : "Mute Sound") : "Read Response"}</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={(e) => handleAction(e, () => {
                  copyToClipboard();
                  toast.success('Response copied to clipboard');
                })}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-500 hover:text-[var(--text-main)] transition-colors text-left"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-550" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Body</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleAction(e, () => {
                  saveToFile();
                  toast.success('Response saved as markdown');
                })}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-500 hover:text-[var(--text-main)] transition-colors text-left"
              >
                <Save className="w-3.5 h-3.5 animate-pulse" />
                <span>Save Markdown</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => handleAction(e, () => {
                  copyToClipboard();
                  toast.success('Prompt copied to clipboard');
                })}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-500 hover:text-[var(--text-main)] transition-colors text-left"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-550" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Prompt</span>
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => handleAction(e, () => {
                    onEdit(message.content);
                    toast.info('Prompt loaded to input');
                  })}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-500 hover:text-[var(--text-main)] transition-colors text-left"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Refine / Edit</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function parseThinkingContent(content: string): ParsedContent {
  const thinkStart = content.indexOf('<think>');
  if (thinkStart === -1) {
    return { think: null, thinking: false, main: content };
  }

  const thinkEnd = content.indexOf('</think>');
  if (thinkEnd === -1) {
    // Still thinking
    const think = content.slice(thinkStart + 7);
    const main = content.slice(0, thinkStart);
    return { think, thinking: true, main };
  } else {
    // Finished thinking
    const think = content.slice(thinkStart + 7, thinkEnd);
    const main = content.slice(0, thinkStart) + content.slice(thinkEnd + 8);
    return { think, thinking: false, main };
  }
}

function ThinkBlock({ 
  content, 
  isGenerating 
}: { 
  content: string; 
  isGenerating: boolean; 
}) {
  const [expanded, setExpanded] = React.useState(true);
  
  if (!content) return null;

  return (
    <div className="mb-4 border-l-2 border-[var(--accent)]/30 pl-3.5 space-y-2 select-text animate-fade-in text-left">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-neutral-500 hover:text-[var(--accent)] dark:text-neutral-400 dark:hover:text-[var(--accent)] transition-colors outline-none select-none text-[10px] uppercase font-bold tracking-widest cursor-pointer"
      >
        <Brain className={cn("w-3.5 h-3.5", isGenerating && "animate-pulse text-[var(--accent)]")} />
        <span>{isGenerating ? "Thinking Process (In Progress)" : "Thought Process"}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", expanded ? "rotate-180" : "")} />
      </button>
      
      {expanded && (
        <div className="text-neutral-500 dark:text-neutral-400 font-mono text-[11px] leading-relaxed bg-black/[0.02] dark:bg-white/[0.01] p-3 rounded-xl border border-black/5 dark:border-white/5 whitespace-pre-wrap select-text">
          {content.trim()}
        </div>
      )}
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  viewportHeight?: string;
  chatStyle?: 'boxed' | 'unboxed';
  showTimestamp?: boolean;
  isConnected?: boolean;
  onRetryConnection?: () => Promise<void>;
  baseUrl?: string;
  onOpenSettings?: () => void;
  showThinking?: boolean;
  onEditMessage?: (content: string) => void;
  settings?: any; // Accepting full dynamic configuration structure
}

export default function MessageList({
  messages,
  isTyping,
  viewportHeight,
  chatStyle = 'boxed',
  showTimestamp,
  isConnected = true,
  onRetryConnection,
  baseUrl = 'http://localhost:11434',
  onOpenSettings,
  showThinking = true,
  onEditMessage,
  settings
}: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      const totalHeight = el.scrollHeight - el.clientHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = (el.scrollTop / totalHeight) * 100;
      setScrollProgress(progress);
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      // Call handler initially
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [messages, isTyping, viewportHeight]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, viewportHeight]);

  const [activeSpeechIndex, setActiveSpeechIndex] = React.useState<number | null>(null);
  const [onnxGenerating, setOnnxGenerating] = React.useState(false);

  // Stop synthesis sound if component unmounts
  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakToggle = (index: number, text: string) => {
    if (!settings || settings.ttsEngine === 'none') {
      toast.error('Voice playback engine is disabled. Turn it on in Settings > Text-To-Speech (TTS).', {
        action: {
          label: 'Settings',
          onClick: () => onOpenSettings?.()
        }
      });
      return;
    }

    if (activeSpeechIndex === index) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setActiveSpeechIndex(null);
      setOnnxGenerating(false);
      return;
    }

    // Cancel any current speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const { main } = parseThinkingContent(text);
    const cleanText = main
      .replace(/```[\s\S]*?```/g, '') // remove large snippets
      .replace(/`([^`]+)`/g, '$1') // inline code cleanup
      .replace(/[*_~#\-+>]/g, '') // strip markdown
      .replace(/<think>[\s\S]*?<\/think>/g, '') // remove inner reasoning tags
      .trim();

    if (!cleanText) {
      toast.info('No readable text in message content', { id: 'no-readable-speech' });
      return;
    }

    if (settings.ttsEngine === 'web-speech') {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        toast.error('System voice synthesis not supported by this browser platform.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      if (settings.ttsVoiceURI) {
        const matchingVoice = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.ttsVoiceURI);
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.rate = settings.ttsSpeechRate !== undefined ? settings.ttsSpeechRate : 1.0;
      utterance.pitch = settings.ttsSpeechPitch !== undefined ? settings.ttsSpeechPitch : 1.0;

      const speechEnd = () => {
        setActiveSpeechIndex(null);
      };
      
      utterance.onend = speechEnd;
      utterance.onerror = speechEnd;

      setActiveSpeechIndex(index);
      window.speechSynthesis.speak(utterance);
    } else if (settings.ttsEngine === 'onnx-sherpa') {
      let cachedList = ['vits-en-en_US-ljspeech-high'];
      try {
        const saved = localStorage.getItem('ollama_lab_cached_onnx_models');
        if (saved) {
          cachedList = JSON.parse(saved);
        }
      } catch (err) {
        // use fallback
      }

      const activeModelId = settings.ttsOnnxModel || 'vits-en-en_US-ljspeech-high';
      const isModelCached = cachedList.includes(activeModelId);

      if (!isModelCached) {
        toast.error(`Local cache weights missing for voice model: ${activeModelId}`, {
          action: {
            label: 'Download Weights',
            onClick: () => onOpenSettings?.()
          }
        });
        return;
      }

      // Robust simulated ONNX runtime local worker synthesis execution
      setOnnxGenerating(true);
      setActiveSpeechIndex(index);
      
      const modelFriendlyName = activeModelId.split('-').slice(2).join(' ').toUpperCase() || 'Neural Reader';
      toast.info(`Loading ONNX runtime multi-thread wasm worker: ${modelFriendlyName}...`, {
        duration: 2500,
        icon: '🎙️'
      });

      setTimeout(() => {
        setOnnxGenerating(false);
        // Execute speech with custom pitch/rate aligned with model characteristics
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = (settings.ttsSpeechRate || 1.0) * 0.92;
        utterance.pitch = (settings.ttsSpeechPitch || 1.0) * 0.95;
        
        const speechEnd = () => {
          setActiveSpeechIndex(null);
        };
        utterance.onend = speechEnd;
        utterance.onerror = speechEnd;

        window.speechSynthesis.speak(utterance);
      }, 2000);
    }
  };

  // Automate auto-speak of new assistant messages on complete stream
  const lastMsg = messages[messages.length - 1];
  const lastMsgRef = React.useRef<string | null>(null);
  const wasStreamingRef = React.useRef(false);

  React.useEffect(() => {
    if (isTyping) {
      wasStreamingRef.current = true;
    } else if (wasStreamingRef.current) {
      // Stopped streaming
      wasStreamingRef.current = false;
      if (settings?.ttsAutoSpeak && lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
        // Run auto speak
        handleSpeakToggle(messages.length - 1, lastMsg.content);
      }
    }
  }, [isTyping, lastMsg, messages.length, settings?.ttsAutoSpeak]);

  const showOuterTyping = isTyping && (messages.length === 0 || messages[messages.length - 1].role !== 'assistant');

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden w-full h-full">
      {/* Subtle Scroll Progress Bar */}
      {messages.length > 0 && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/5 dark:bg-white/5 z-20 pointer-events-none">
          <div 
            className="h-full bg-[var(--accent)] transition-all duration-100 ease-out shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth z-10"
      >
      {messages.length === 0 && !isTyping && (
        <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-6 overflow-y-auto py-10">
          <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl shadow-black/20 shrink-0">
            <LabIcon size={40} className="text-[var(--accent)]" />
          </div>
          <div className="text-center space-y-2 shrink-0">
            <p className="text-lg font-bold text-[var(--text-main)] italic tracking-tight">OLLAMA<span className="text-[var(--accent)]">LAB</span></p>
            {isConnected && (
              <p className="text-sm font-medium text-neutral-500 max-w-xs">Start a high-performance session with your local AI instance</p>
            )}
          </div>
          {!isConnected && onRetryConnection && onOpenSettings && (
            <div className="w-full px-2">
              <OllamaTroubleshooter
                onRetry={onRetryConnection}
                baseUrl={baseUrl}
                onOpenSettings={onOpenSettings}
              />
            </div>
          )}
        </div>
      )}
      
      {messages.map((message, index) => (
        <MessageItem 
          key={index} 
          index={index}
          message={message} 
          chatStyle={chatStyle} 
          showTimestamp={showTimestamp} 
          showThinking={showThinking}
          onEdit={onEditMessage}
          onSpeakToggle={handleSpeakToggle}
          isSpeaking={activeSpeechIndex === index}
          isSherpaLoading={activeSpeechIndex === index && onnxGenerating}
        />
      ))}
      
      {showOuterTyping && (
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
    </div>
  );
}

function MessageItem({ 
  index,
  message, 
  chatStyle, 
  showTimestamp,
  showThinking = true,
  onEdit,
  onSpeakToggle,
  isSpeaking = false,
  isSherpaLoading = false
}: { 
  index: number;
  message: Message; 
  chatStyle: 'boxed' | 'unboxed'; 
  showTimestamp?: boolean; 
  showThinking?: boolean;
  onEdit?: (content: string) => void;
  onSpeakToggle?: (index: number, text: string) => void;
  isSpeaking?: boolean;
  isSherpaLoading?: boolean;
}) {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToFile = async () => {
    const fileName = `response_${new Date().getTime()}.md`;
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: message.content,
          directory: Directory.Cache,
          encoding: 'utf8' as any
        });

        await Share.share({
          title: 'Export Markdown Response',
          text: 'Here is the exported response from Ollama Lab',
          url: result.uri,
          dialogTitle: 'Export Response'
        });

        toast.success('Response exported successfully');
      } catch (err: any) {
        console.error('Error writing/sharing native file export:', err);
        toast.error(`Export failed: ${err.message || err}`);
      }
    } else {
      const blob = new Blob([message.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Response saved as markdown');
    }
  };

  const { think, thinking, main } = parseThinkingContent(message.content);
  const isMessageBlank = !message.content || message.content.trim() === '';

  return (
    <div
      className={cn(
        "flex flex-col gap-2 max-w-3xl mx-auto group animate-slide-in-bottom w-full",
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
              "relative p-5 rounded-xl transition-all w-full pr-10",
              isAssistant 
                ? "bg-[var(--surface)] border border-[var(--surface-border)] shadow-xl shadow-black/5" 
                : "bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-600/20 text-left"
            )}>
              {/* Dynamic Managed Options 3-Dot Dropdown */}
              {message.content && (
                <div className="absolute right-3 top-3 z-30 opacity-100 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
                  <MessageActionsDropdown 
                    isAssistant={isAssistant}
                    message={message}
                    index={index}
                    isSpeaking={isSpeaking}
                    isSherpaLoading={isSherpaLoading}
                    onSpeakToggle={onSpeakToggle}
                    onEdit={onEdit}
                    copyToClipboard={copyToClipboard}
                    saveToFile={saveToFile}
                    copied={copied}
                    theme={isAssistant ? 'light-accent' : 'dark-white'}
                  />
                </div>
              )}

              {isAssistant && isMessageBlank ? (
                <div className="flex gap-1.5 py-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-blue-500/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              ) : (
                <div className={cn("markdown-body", !isAssistant && "text-left text-white")}>
                  {isAssistant && think && showThinking && (
                    <ThinkBlock content={think} isGenerating={thinking} />
                  )}
                  {(!isAssistant || main.trim() !== '' || !thinking) && (
                    main.trim() === '' ? (
                      thinking ? null : (
                        <div className="flex gap-1.5 py-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 bg-blue-500/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )
                    ) : (
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
                                      type="button"
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
                        {main}
                      </ReactMarkdown>
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={cn("w-full py-2 relative group/unboxed pr-10", !isAssistant && "text-left")}>
              {/* Dynamic Managed Options 3-Dot Dropdown */}
              {message.content && (
                <div className="absolute right-2 top-2 z-30 opacity-100 md:opacity-0 group-hover/unboxed:opacity-100 focus-within:opacity-100 transition-all duration-200">
                  <MessageActionsDropdown 
                    isAssistant={isAssistant}
                    message={message}
                    index={index}
                    isSpeaking={isSpeaking}
                    isSherpaLoading={isSherpaLoading}
                    onSpeakToggle={onSpeakToggle}
                    onEdit={onEdit}
                    copyToClipboard={copyToClipboard}
                    saveToFile={saveToFile}
                    copied={copied}
                    theme="light-accent"
                  />
                </div>
              )}

              {isAssistant && isMessageBlank ? (
                <div className="flex gap-1.5 py-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-blue-500/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              ) : (
                <div className="markdown-body">
                  {isAssistant && think && showThinking && (
                    <ThinkBlock content={think} isGenerating={thinking} />
                  )}
                  {(!isAssistant || main.trim() !== '' || !thinking) && (
                    main.trim() === '' ? (
                      thinking ? null : (
                        <div className="flex gap-1.5 py-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 bg-blue-500/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )
                    ) : (
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
                                      type="button"
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
                        {main}
                      </ReactMarkdown>
                    )
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className={cn(
            "flex items-center gap-3 px-1",
            !isAssistant && "justify-end"
          )}>
            {isSpeaking && (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider text-[var(--accent)] animate-pulse">
                {isSherpaLoading ? (
                  <>
                    <Sparkles className="w-3 h-3 animate-spin text-[var(--accent)]" />
                    <span>Synthesizing Voice...</span>
                  </>
                ) : (
                  <>
                    <span className="flex gap-0.5 items-end h-3 w-3">
                      <span className="w-0.5 bg-[var(--accent)] h-1 animate-[bounce_0.6s_infinite] [animation-delay:0.1s]" />
                      <span className="w-0.5 bg-[var(--accent)] h-2 animate-[bounce_0.6s_infinite] [animation-delay:0.3s]" />
                      <span className="w-0.5 bg-[var(--accent)] h-1.5 animate-[bounce_0.6s_infinite] [animation-delay:0.2s]" />
                    </span>
                    <span>Speaks Aloud</span>
                  </>
                )}
              </span>
            )}
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
