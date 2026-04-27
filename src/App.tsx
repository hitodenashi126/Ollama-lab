import React from 'react';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import { ChatSession, Message, Settings, OllamaModel } from './types';
import { DEFAULT_SETTINGS, listModels, chatStream } from './lib/ollama';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence } from 'motion/react';
import { Menu } from 'lucide-react';

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Theme effect
  React.useEffect(() => {
    const themeClasses = ['glass-dark', 'glass-light', 'solid-dark', 'solid-light'];
    document.documentElement.classList.remove(...themeClasses, 'dark', 'light');
    document.documentElement.classList.add(settings.theme);
    
    // Add compatibility classes for tailwind utilities
    if (settings.theme.includes('dark')) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [settings.theme]);

  // Persistence
  React.useEffect(() => {
    localStorage.setItem('ollama_sessions', JSON.stringify(sessions));
  }, [sessions]);

  React.useEffect(() => {
    localStorage.setItem('ollama_settings', JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('ollama_current_session', currentSessionId);
    }
  }, [currentSessionId]);

  React.useEffect(() => {
    localStorage.setItem('ollama_selected_model', selectedModel);
  }, [selectedModel]);

  // Fetch models
  const fetchModels = React.useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const fetchedModels = await listModels(settings.baseUrl);
      if (fetchedModels.length > 0) {
        setModels(fetchedModels);
        setIsConnected(true);
        if (!selectedModel) {
          setSelectedModel(fetchedModels[0].name);
        }
      } else {
        // If listModels returns [] it might be an error or just no models
        // But listModels catch block returns [], so we check response in listModels if possible
        // Actually listModels in current implementation returns [] on error.
        // Let's assume [] means potentially disconnected if no models exist, 
        // but normally Ollama has at least one model or it confirms it's up.
        // Wait, if it's up but 0 models, it's still connected.
        // Let's modify listModels to be more descriptive or check connection here.
        
        // For now, let's look at listModels output. It logs error to console.
        // We can check if it's truly connected by a simple fetch.
        const response = await fetch(`${settings.baseUrl}/api/tags`).catch(() => null);
        setIsConnected(!!response?.ok);
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.baseUrl, selectedModel]);

  React.useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Polling for connection if disconnected
  React.useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(() => {
      fetchModels();
    }, 5000);

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

  const handleSendMessage = async (content: string, images?: string[]) => {
    if (!selectedModel) {
      alert('Please select a model first');
      return;
    }

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
      images,
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
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? {
              ...s,
              messages: [...s.messages.slice(0, -1), { 
                role: 'assistant', 
                content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to Ollama. Make sure it is running and accessible.'}`, 
                timestamp: Date.now() 
              }]
            }
          : s
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full relative overflow-hidden text-[var(--text-main)] selection:bg-blue-500 selection:text-white">
      {/* Mesh Gradient Background */}
      <div className="mesh-gradient absolute inset-0 z-0" />
      
      <div className="flex w-full h-full relative z-10 md:p-4 lg:p-6 md:gap-4 lg:gap-6">
        <div className="flex w-full h-full bg-[var(--surface)] backdrop-blur-3xl md:border md:border-[var(--surface-border)] md:rounded-[32px] overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/50 transition-colors">
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
            models={models}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isLoadingModels={isLoadingModels}
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
                <div className={`w-2 h-2 rounded-full animate-pulse transition-all duration-500 ${
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
              />
              
              <div className="bg-gradient-to-t from-black/20 to-transparent pt-12">
                <ChatInput 
                  onSend={handleSendMessage} 
                  disabled={isStreaming} 
                  selectedModel={selectedModel}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onSave={setSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
