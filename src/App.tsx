import React from 'react';
import Sidebar from './components/Sidebar';
import { LabIcon } from './components/LabIcon';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import { ChatSession, Message, Settings, OllamaModel, FileAttachment } from './types';
import { DEFAULT_SETTINGS, listModels, chatStream } from './lib/ollama';
import { v4 as uuidv4 } from 'uuid';
import { Menu, AlertTriangle } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [sessions, setSessions] = React.useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ollama_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(() => {
    const saved = localStorage.getItem('ollama_current_session');
    return saved || null;
  });

  const [settings, setSettings] = React.useState<Settings>(() => {
    const saved = localStorage.getItem('ollama_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [models, setModels] = React.useState<OllamaModel[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<string>(() => {
    return localStorage.getItem('ollama_selected_model') || '';
  });

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isLoadingModels, setIsLoadingModels] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [pullProgress, setPullProgress] = React.useState<{ status: string; percentage?: number } | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [viewportHeight, setViewportHeight] = React.useState('100dvh');
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Handle visual viewport for mobile keyboard
  React.useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      setViewportHeight(`${window.visualViewport?.height}px`);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    // Initial call
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Theme and Accent Color effect
  React.useEffect(() => {
    const themeClasses = ['glass-dark', 'glass-light', 'solid-dark', 'solid-light'];
    document.documentElement.classList.remove(...themeClasses, 'dark', 'light');
    document.documentElement.classList.add(settings.theme);
    
    // Set accent color
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.style.setProperty('--accent-bg', settings.accentColor);
    
    // Set font settings
    document.documentElement.classList.remove('font-sans', 'font-serif', 'font-mono');
    document.documentElement.classList.add(`font-${settings.fontFamily}`);
    document.documentElement.style.setProperty('--chat-font-size', `${settings.fontSize}px`);
    
    // Add compatibility classes for tailwind utilities
    if (settings.theme.includes('dark')) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [settings.theme, settings.accentColor]);

  // Persistence
  React.useEffect(() => {
    localStorage.setItem('ollama_sessions', JSON.stringify(sessions));
  }, [sessions]);

  React.useEffect(() => {
    localStorage.setItem('ollama_settings', JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    localStorage.setItem('ollama_current_session', currentSessionId || '');
  }, [currentSessionId]);

  React.useEffect(() => {
    localStorage.setItem('ollama_selected_model', selectedModel);
  }, [selectedModel]);

  // Sync state across tabs
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ollama_sessions' && e.newValue) {
        setSessions(JSON.parse(e.newValue));
      }
      if (e.key === 'ollama_settings' && e.newValue) {
        setSettings(JSON.parse(e.newValue));
      }
      if (e.key === 'ollama_current_session') {
        setCurrentSessionId(e.newValue || null);
      }
      if (e.key === 'ollama_selected_model') {
        setSelectedModel(e.newValue || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch models
  const isLoadingRef = React.useRef(false);
  const fetchModels = React.useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoadingModels(true);
    try {
      const fetchedModels = await listModels(settings.baseUrl);
      if (fetchedModels.length > 0) {
        setModels(fetchedModels);
        setIsConnected(true);
        setSelectedModel(prev => prev || fetchedModels[0].name);
      } else {
        // Robust connection check - just a ping
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          const response = await fetch(`${settings.baseUrl}/api/tags`, { signal: controller.signal });
          setIsConnected(!!response?.ok);
        } catch (e) {
          setIsConnected(false);
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch (error) {
      setIsConnected(false);
      console.error('Failed to fetch models:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingModels(false);
    }
  }, [settings.baseUrl]);

  React.useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Polling for connection if disconnected - more conservative interval
  React.useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(() => {
      fetchModels();
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected, fetchModels]);

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      model: selectedModel,
      createdAt: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    if (currentSessionId === id) {
      setCurrentSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleSendMessage = async (content: string, attachments?: FileAttachment[]) => {
    if (!selectedModel) {
      toast.error('Please select a model first');
      return;
    }

    if (isStreaming) return;

    let sessionId = currentSessionId;
    let session = currentSession;

    // Create new session if none exists
    if (!sessionId || !session) {
      const newSession: ChatSession = {
        id: uuidv4(),
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [],
        model: selectedModel,
        createdAt: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
      session = newSession;
    }

    const userMessage: Message = {
      role: 'user',
      content,
      attachments,
      timestamp: Date.now(),
    };

    const initialAssistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Update session with user message and placeholder assistant message
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMessage, initialAssistantMessage],
            title: s.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : s.title
          } 
        : s
    ));

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      let accumulatedContent = '';
      await chatStream(
        settings.baseUrl,
        selectedModel,
        [...session.messages, userMessage],
        settings,
        (chunk) => {
          accumulatedContent += chunk;
          setSessions(prev => prev.map(s => 
            s.id === sessionId 
              ? {
                  ...s,
                  messages: s.messages.map((m, idx) => 
                    idx === s.messages.length - 1 ? { ...m, content: accumulatedContent } : m
                  )
                }
              : s
          ));
        },
        controller.signal
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('Chat error:', error);
        
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? {
                ...s,
                messages: [...s.messages.slice(0, -1), { 
                  role: 'assistant', 
                  content: `⚠️ **Ollama Error**\n\n${errorMessage}\n\n*Check if Ollama is running and the model is loaded.*`, 
                  timestamp: Date.now() 
                }]
              }
            : s
        ));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handlePullModel = async (name: string) => {
    try {
      setPullProgress({ status: 'Starting...' });
      await import('./lib/ollama').then(m => m.pullModel(settings.baseUrl, name, (status, percentage) => {
        setPullProgress({ status, percentage });
      }));
      fetchModels();
      toast.success(`Model ${name} pulled successfully`);
    } catch (error) {
      console.error('Failed to pull model:', error);
      toast.error(`Failed to pull model: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPullProgress(null);
    }
  };

  const handleDeleteModel = async (name: string) => {
    if (!confirm(`Are you sure you want to delete model "${name}"?`)) return;
    try {
      await import('./lib/ollama').then(m => m.deleteModel(settings.baseUrl, name));
      fetchModels();
      toast.success(`Model ${name} deleted`);
      if (selectedModel === name) {
        setSelectedModel(models.find(m => m.name !== name)?.name || '');
      }
    } catch (error) {
      console.error('Failed to delete model:', error);
      toast.error('Failed to delete model');
    }
  };

  return (
    <div 
      style={{ height: viewportHeight }}
      className="flex w-full relative overflow-hidden text-[var(--text-main)] selection:bg-blue-500 selection:text-white"
    >
      {/* Mesh Gradient Background */}
      <div className="mesh-gradient absolute inset-0 z-0" />
      
      <div className="flex w-full h-full relative z-10 md:p-4 lg:p-6 md:gap-4 lg:gap-6">
        <div className="flex w-full h-full bg-[var(--surface)] backdrop-blur-3xl md:border md:border-[var(--surface-border)] md:rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/50 transition-colors">
          <Sidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => {
              setCurrentSessionId(id);
              setIsMobileMenuOpen(false);
            }}
            onNewSession={() => {
              handleNewSession();
              setIsMobileMenuOpen(false);
            }}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isMobileOpen={isMobileMenuOpen}
            onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          <main className="flex-1 flex flex-col min-w-0 relative h-full">
            <header className="h-16 border-b border-[var(--surface-border)] flex items-center justify-between bg-white/[0.01] px-4 md:px-6 shrink-0 relative z-10 transition-colors">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 text-neutral-400"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[var(--text-main)] transition-colors">
                    {currentSession?.title || 'No active session'}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                    {selectedModel ? `Model: ${selectedModel}` : 'Select a model'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LabIcon size={20} className={isConnected ? "text-green-500" : "text-red-500"} />
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse transition-all duration-500 ${
                  isConnected ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"
                }`} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 hidden sm:inline transition-colors">
                  {isConnected ? 'Local Instance Connected' : 'Ollama Offline - Retrying...'}
                </span>
              </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden relative">
              <MessageList 
                messages={currentSession?.messages || []} 
                isTyping={isStreaming}
                viewportHeight={viewportHeight}
                chatStyle={settings.chatStyle}
                showTimestamp={settings.showTimestamp}
              />
              
              <div className="bg-gradient-to-t from-black/20 to-transparent pt-12">
                <ChatInput 
                  onSend={handleSendMessage} 
                  disabled={isStreaming} 
                  selectedModel={selectedModel}
                  models={models}
                  onSelectModel={setSelectedModel}
                  isTyping={isStreaming}
                  onStop={handleStop}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setIsSettingsOpen(false)}
          models={models}
          onPullModel={handlePullModel}
          onDeleteModel={handleDeleteModel}
          pullProgress={pullProgress}
        />
      )}
      <Toaster position="top-right" expand={false} richColors />
    </div>
  );
}
