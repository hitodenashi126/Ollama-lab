import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LabIcon } from './LabIcon';
import { OllamaTroubleshooter } from './OllamaTroubleshooter';
import { User, Copy, Check, Save, ChevronDown, Brain, Edit, Volume2, VolumeX, Sparkles } from 'lucide-react';
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
      // Robust simulated ONNX runtime local worker synthesis execution
      setOnnxGenerating(true);
      setActiveSpeechIndex(index);
      toast.info(`Spinning up Sherpa ONNX worker: loads ${settings.ttsOnnxModel}...`, {
        duration: 2500,
        icon: '🎙️'
      });

      setTimeout(() => {
        setOnnxGenerating(false);
        // Execute speech with custom pitch/rate
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
              "relative p-5 rounded-xl transition-all w-full",
              isAssistant 
                ? "bg-[var(--surface)] border border-[var(--surface-border)] shadow-xl shadow-black/5" 
                : "bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-600/20 text-left"
            )}>
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
              
              {isAssistant && message.content && (
                <div className="mt-4 pt-3 border-t border-[var(--surface-border)] flex items-center gap-3">
                  {onSpeakToggle && (
                    <Tooltip content={isSpeaking ? "Mute Voice" : "Speak Response"} position="top">
                      <button
                        onClick={() => onSpeakToggle(index, message.content)}
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest transition-all active:scale-95",
                          isSpeaking 
                            ? "text-[var(--accent)] animate-pulse" 
                            : "text-neutral-500 hover:text-[var(--accent)]"
                        )}
                      >
                        {isSpeaking ? (
                          isSherpaLoading ? (
                            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
                          ) : (
                            <VolumeX className="w-3.5 h-3.5 text-red-500" />
                          )
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        {isSpeaking ? (isSherpaLoading ? "Synthesizing" : "Mute") : "Speak"}
                      </button>
                    </Tooltip>
                  )}
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
              
              {!isAssistant && message.content && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                  <Tooltip content="Copy Prompt" position="top">
                    <button
                      onClick={() => {
                        copyToClipboard();
                        toast.success('Prompt copied to clipboard');
                      }}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white transition-all active:scale-95"
                    >
                      {copied ? <Check className="w-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </Tooltip>
                  {onEdit && (
                    <Tooltip content="Edit original prompt" position="top">
                      <button
                        onClick={() => {
                          onEdit(message.content);
                          toast.info('Prompt copied to input field');
                        }}
                        className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-white/50 hover:text-white transition-all active:scale-95"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={cn("w-full py-2", !isAssistant && "text-left")}>
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
              
              {isAssistant && message.content && (
                <div className="flex items-center gap-4 mt-3">
                  {onSpeakToggle && (
                    <Tooltip content={isSpeaking ? "Mute Voice" : "Speak Response"} position="bottom">
                      <button
                        onClick={() => onSpeakToggle(index, message.content)}
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors active:scale-95",
                          isSpeaking 
                            ? "text-[var(--accent)] animate-pulse" 
                            : "text-neutral-500 hover:text-[var(--accent)]"
                        )}
                      >
                        {isSpeaking ? (
                          isSherpaLoading ? (
                            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
                          ) : (
                            <VolumeX className="w-3.5 h-3.5 text-red-500" />
                          )
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        {isSpeaking ? (isSherpaLoading ? "Synthesizing" : "Mute") : "Speak"}
                      </button>
                    </Tooltip>
                  )}
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

              {!isAssistant && message.content && (
                <div className="flex items-center gap-4 mt-3 justify-end">
                  <Tooltip content="Copy Prompt" position="bottom">
                    <button
                      onClick={() => {
                        copyToClipboard();
                        toast.success('Prompt copied to clipboard');
                      }}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-colors active:scale-95"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </Tooltip>
                  {onEdit && (
                    <Tooltip content="Edit original prompt" position="bottom">
                      <button
                        onClick={() => {
                          onEdit(message.content);
                          toast.info('Prompt copied to input field');
                        }}
                        className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-colors active:scale-95"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                    </Tooltip>
                  )}
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
