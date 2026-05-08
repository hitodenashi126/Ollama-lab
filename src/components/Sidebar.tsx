import { ChatSession, OllamaModel, Settings } from '../types';
import { Plus, MessageSquare, Settings as SettingsIcon, Trash2, Cpu, Database, ChevronLeft, ChevronRight, Edit2, Check, X, Download, FileJson } from 'lucide-react';
import { cn, formatSize } from '../lib/utils';
import React from 'react';
import { Tooltip } from './Tooltip';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  isMobileOpen,
  onToggleMobile
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState('');

  const startEditing = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const exportSession = (session: ChatSession, format: 'json' | 'md') => {
    let content = '';
    let mimeType = '';
    let fileName = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export`;

    if (format === 'json') {
      content = JSON.stringify(session, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      content = `# ${session.title}\n\n`;
        session.messages.forEach(msg => {
          const role = msg.role === 'user' ? 'User' : 'Assistant';
          content += `### ${role} (${new Date(msg.timestamp).toLocaleString()})\n\n${msg.content}\n\n`;
          if (msg.attachments && msg.attachments.length > 0) {
            content += `*Attached Files: ${msg.attachments.length} (not included in flat text export)*\n\n`;
          }
          content += `---\n\n`;
        });
      mimeType = 'text/markdown';
      fileName += '.md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onToggleMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={cn(
          "bg-[var(--surface)] backdrop-blur-3xl border-r border-[var(--surface-border)] flex flex-col h-full absolute inset-y-0 left-0 md:relative md:inset-auto transition-all duration-300 z-50 md:z-20 shadow-xl",
          isCollapsed ? "w-[72px]" : "w-[280px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
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
          <Tooltip content={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} position="right">
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
          </Tooltip>
        </div>

      <div className="p-4 shrink-0">
        <Tooltip content="Start a fresh chat" position={isCollapsed ? "right" : "bottom"} className={isCollapsed ? "ml-4" : ""}>
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
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <section>
          {!isCollapsed && <h2 className="px-3 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-500 tracking-widest mb-3">Recent Chats</h2>}
          <div className="space-y-1">
            {sessions.map((session) => (
              <div key={session.id} className="group relative">
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 -my-1 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--accent)]/30">
                    <input
                      autoFocus
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(session.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0 text-[var(--text-main)]"
                    />
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleRename(session.id)}
                        className="p-1 hover:text-green-500 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={cancelEditing}
                        className="p-1 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left pr-16 active:scale-[0.98]",
                        currentSessionId === session.id
                          ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30"
                          : "text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)] transition-colors"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
                      {!isCollapsed && <span className="truncate transition-colors">{session.title}</span>}
                    </button>
                    {!isCollapsed && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity translate-z-0">
                      <Tooltip content="Export Markdown" position="top">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportSession(session, 'md'); }}
                          className="p-1.5 hover:text-green-500 transition-all rounded-md hover:bg-green-500/10 text-neutral-500 active:scale-90"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Export JSON" position="top">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportSession(session, 'json'); }}
                          className="p-1.5 hover:text-blue-500 transition-all rounded-md hover:bg-blue-500/10 text-neutral-500 active:scale-90"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Rename" position="top">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(session); }}
                          className="p-1.5 hover:text-[var(--accent)] transition-all rounded-md hover:bg-[var(--accent)]/10 text-neutral-500 active:scale-90"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete" position="top">
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                          className="p-1.5 hover:text-red-400 transition-all rounded-md hover:bg-red-500/10 text-neutral-500 active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-black/5 dark:border-white/10 transition-colors">
        <button
          onClick={onOpenSettings}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--text-main)] transition-all active:scale-[0.98] active:bg-black/10 dark:active:bg-white/20",
            isCollapsed && "justify-center px-0"
          )}
        >
          <SettingsIcon className="w-4 h-4" />
          {!isCollapsed && <span>Engine Settings</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
