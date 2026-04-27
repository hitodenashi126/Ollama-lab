import { ChatSession, OllamaModel, Settings } from '../types';
import { Plus, MessageSquare, Settings as SettingsIcon, Trash2, Cpu, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatSize } from '../lib/utils';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  models: OllamaModel[];
  selectedModel: string;
  onSelectModel: (name: string) => void;
  onOpenSettings: () => void;
  isLoadingModels: boolean;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  models,
  selectedModel,
  onSelectModel,
  onOpenSettings,
  isLoadingModels,
  isMobileOpen,
  onToggleMobile
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggleMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 72 : 280,
          x: isMobileOpen ? 0 : (window.innerWidth < 768 ? -280 : 0)
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "bg-[var(--surface)] backdrop-blur-3xl border-r border-[var(--surface-border)] flex flex-col h-screen fixed md:relative transition-all z-50 md:z-20 shadow-xl",
          !isMobileOpen && "pointer-events-none md:pointer-events-auto"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-[var(--surface-border)] h-16 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center transition-colors">
                <Cpu className="w-5 h-5 text-[var(--accent-text)]" />
              </div>
              <h1 className="font-bold text-lg tracking-tight text-[var(--text-main)] italic">OLLAMA<span className="text-[var(--accent)]">LAB</span></h1>
            </div>
          )}
          <button 
            onClick={() => {
              if (window.innerWidth < 768) {
                onToggleMobile();
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-neutral-400"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

      <div className="p-4 shrink-0">
        <button
          onClick={onNewSession}
          className={cn(
            "w-full flex items-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[var(--text-main)] rounded-xl py-3 px-4 gap-3 hover:bg-black/10 dark:hover:bg-white/10 transition-all font-medium text-sm shadow-xl shadow-black/10 dark:shadow-black/20",
            isCollapsed && "px-3 justify-center"
          )}
        >
          <Plus className="w-4 h-4 text-[var(--accent)] stroke-[3]" />
          {!isCollapsed && <span>New Session</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
        <section>
          {!isCollapsed && <h2 className="px-3 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-500 tracking-widest mb-3">Recent Chats</h2>}
          <div className="space-y-1">
            {sessions.map((session) => (
              <div key={session.id} className="group relative">
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                    currentSessionId === session.id
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30"
                      : "text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)] transition-colors"
                  )}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
                  {!isCollapsed && <span className="truncate pr-4 transition-colors">{session.title}</span>}
                </button>
                {!isCollapsed && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all rounded-md hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 mb-3">
              <h2 className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-500 tracking-widest">Available Models</h2>
              <div className="flex bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-full px-1.5 py-0.5 items-center gap-1">
                 <div className={cn("w-1 h-1 rounded-full", models.length > 0 ? "bg-green-500" : "bg-red-500")} />
                 <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-500 uppercase">{models.length}</span>
              </div>
            </div>
          )}
          <div className="space-y-1">
            {isLoadingModels ? (
              <div className="space-y-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-4 h-4 rounded-md skeleton shrink-0" />
                    {!isCollapsed && (
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="h-3.5 w-3/4 skeleton rounded-md" />
                        <div className="h-2.5 w-1/4 skeleton rounded-md" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : models.length === 0 ? (
              <div className="px-3 py-4 text-xs text-neutral-600 italic">No models found</div>
            ) : (
              models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => onSelectModel(model.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left group",
                    selectedModel === model.name
                      ? "bg-black/10 dark:bg-white/10 text-[var(--text-main)] border border-black/5 dark:border-white/10"
                      : "text-neutral-500 dark:text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)]"
                  )}
                >
                  <Database className={cn("w-4 h-4 shrink-0 transition-colors", selectedModel === model.name ? "text-[var(--accent)]" : "text-neutral-400 dark:text-neutral-600")} />
                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium transition-colors">{model.name}</span>
                      <span className="text-[10px] opacity-60 dark:opacity-50 flex items-center gap-1 transition-colors">
                         {formatSize(model.size)}
                      </span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-black/5 dark:border-white/10 transition-colors">
        <button
          onClick={onOpenSettings}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--text-main)] transition-all",
            isCollapsed && "justify-center px-0"
          )}
        >
          <SettingsIcon className="w-4 h-4" />
          {!isCollapsed && <span>Engine Settings</span>}
        </button>
      </div>
    </motion.aside>
    </>
  );
}
