import React from 'react';
import { Settings, OllamaModel } from '../types';
import { 
  X, Server, Layout, Sliders, Info, ShieldCheck, Settings as SettingsIcon, 
  Moon, Sun, AlertTriangle, Monitor, Palette, Box, MessageSquare, 
  Database, Download, Trash2, Search, CheckCircle2, Clock 
} from 'lucide-react';
import { cn, formatSize } from '../lib/utils';
import { toast } from 'sonner';

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
  models: OllamaModel[];
  onPullModel: (name: string) => Promise<void>;
  onDeleteModel: (name: string) => Promise<void>;
  pullProgress: { status: string; percentage?: number } | null;
}

type Category = 'general' | 'models' | 'chat-ui' | 'parameters';

export default function SettingsModal({ 
  settings, 
  onSave, 
  onClose, 
  models, 
  onPullModel, 
  onDeleteModel,
  pullProgress 
}: SettingsModalProps) {
  const [formData, setFormData] = React.useState<Settings>({ ...settings });
  const [activeCategory, setActiveCategory] = React.useState<Category>('general');
  const [newModelName, setNewModelName] = React.useState('');

  const handleSave = () => {
    onSave(formData);
    toast.success('Configuration saved successfully');
    onClose();
  };

  const categories = [
    { id: 'general', name: 'General', icon: Monitor },
    { id: 'models', name: 'Models', icon: Database },
    { id: 'chat-ui', name: 'Chat UI', icon: Palette },
    { id: 'parameters', name: 'Parameters', icon: Sliders },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
      />
      <div
        className="relative bg-[var(--surface)] backdrop-blur-2xl w-full max-w-3xl rounded-3xl border border-[var(--surface-border)] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[min(680px,calc(100dvh-2rem))] shadow-black/20 dark:shadow-black/60 transition-colors duration-300 animate-scale-in"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-black/5 dark:bg-white/5 border-r border-[var(--surface-border)] flex flex-col shrink-0">
          <div className="p-6 border-b border-[var(--surface-border)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white">
                <SettingsIcon className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm text-[var(--text-main)] tracking-tight">Settings</h2>
            </div>
          </div>
          
          <nav className="flex-1 p-3 space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as Category)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98]",
                  activeCategory === cat.id 
                    ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-lg shadow-[var(--accent)]/20" 
                    : "text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)]"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-[var(--surface-border)]">
            <div className="flex items-center gap-2 text-[var(--accent)] text-[8px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Local & Private
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-transparent overflow-hidden">
          <div className="p-4 md:p-6 border-b border-[var(--surface-border)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--text-main)] uppercase tracking-widest text-[10px]">
              {categories.find(c => c.id === activeCategory)?.name} Configuration
            </h3>
            <button onClick={onClose} className="md:hidden p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-neutral-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
            {activeCategory === 'general' && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Sun className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Interface Theme</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'glass-dark', name: 'Glass Dark', icon: Moon },
                      { id: 'glass-light', name: 'Glass Light', icon: Sun },
                      { id: 'solid-dark', name: 'B & W', icon: Moon },
                      { id: 'solid-light', name: 'W & B', icon: Sun },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setFormData({ ...formData, theme: t.id as any })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center group active:scale-[0.98]",
                          formData.theme === t.id 
                            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)] shadow-lg shadow-[var(--accent)]/20" 
                            : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-500 hover:border-[var(--accent)]/50"
                        )}
                      >
                        <t.icon className={cn("w-5 h-5 transition-colors", formData.theme === t.id ? "text-[var(--accent-text)]" : "text-neutral-400 group-hover:text-[var(--accent)]")} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Server className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Connectivity</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 px-1 uppercase tracking-wider">Ollama API Endpoint</label>
                    <input
                      type="text"
                      value={formData.baseUrl}
                      onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/50 transition-all font-mono"
                    />
                  </div>
                </section>

                <section className="space-y-4">
                   <div className="flex items-center gap-2 text-neutral-500">
                    <Layout className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Global Persona</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 px-1 uppercase tracking-wider">System Instructions</label>
                    <textarea
                      value={formData.systemPrompt}
                      onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all min-h-[100px] resize-none"
                    />
                  </div>
                </section>
              </>
            )}

            {activeCategory === 'models' && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Download className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Pull New Model</h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="e.g. llama3, mistral, deepseek-coder"
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (newModelName.trim()) {
                          onPullModel(newModelName.trim());
                          setNewModelName('');
                        }
                      }}
                      disabled={!!pullProgress || !newModelName.trim()}
                      className="px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 active:scale-95 transition-all"
                    >
                      Pull
                    </button>
                  </div>
                  {pullProgress && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2 animate-fade-in">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                        <span>{pullProgress.status}</span>
                        {pullProgress.percentage !== undefined && <span>{pullProgress.percentage}%</span>}
                      </div>
                      <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--accent)] transition-all duration-300"
                          style={{ width: `${pullProgress.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Database className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Installed Models</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {models.map((model) => (
                      <div 
                        key={model.name}
                        className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl group hover:border-[var(--accent)]/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                            <Box className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[var(--text-main)]">{model.name}</span>
                            <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-medium">
                              {formatSize(model.size)} • {model.details.parameter_size}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteModel(model.name)}
                          className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {models.length === 0 && (
                      <div className="text-center py-8 text-xs text-neutral-500 italic">No models installed</div>
                    )}
                  </div>
                </section>
              </>
            )}

            {activeCategory === 'chat-ui' && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <MessageSquare className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Message Style</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'boxed', name: 'Boxed', description: 'Bubble style with borders' },
                      { id: 'unboxed', name: 'Streamlined', description: 'Clean, borderless layout' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setFormData({ ...formData, chatStyle: s.id as any })}
                        className={cn(
                          "flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left group",
                          formData.chatStyle === s.id 
                            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)] shadow-lg shadow-[var(--accent)]/20" 
                            : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-500 hover:border-[var(--accent)]/50"
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest">{s.name}</span>
                        <p className={cn("text-[9px] font-medium leading-tight", formData.chatStyle === s.id ? "opacity-80" : "text-neutral-500")}>
                          {s.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Palette className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Accent Color</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: 'Blue', color: '#3b82f6' },
                      { name: 'Purple', color: '#a855f7' },
                      { name: 'Green', color: '#10b981' },
                      { name: 'Orange', color: '#f59e0b' },
                      { name: 'Rose', color: '#f43f5e' },
                      { name: 'Cyan', color: '#06b6d4' },
                    ].map((p) => (
                      <button
                        key={p.color}
                        onClick={() => setFormData({ ...formData, accentColor: p.color })}
                        className={cn(
                          "w-10 h-10 rounded-full border-4 transition-all flex items-center justify-center",
                          formData.accentColor === p.color 
                            ? "border-[var(--accent)]/50 scale-110 shadow-lg" 
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      >
                        {formData.accentColor === p.color && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Clock className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Extra Information</h3>
                  </div>
                  <label className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">Show Timestamps</span>
                      <span className="text-[9px] text-neutral-500 font-medium">Display when messages were sent</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showTimestamp}
                      onChange={(e) => setFormData({ ...formData, showTimestamp: e.target.checked })}
                      className="w-10 h-5 bg-black/20 dark:bg-white/20 rounded-full appearance-none checked:bg-[var(--accent)] transition-all relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all"
                    />
                  </label>
                </section>
              </>
            )}

            {activeCategory === 'parameters' && (
              <section className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Sliders className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest">Neural Parameters</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Temperature</label>
                        <span className="text-[10px] font-mono font-bold bg-[var(--accent)] text-[var(--accent-text)] px-2 py-0.5 rounded-full">{formData.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                      />
                      <div className="flex justify-between text-[8px] text-neutral-600 font-bold uppercase tracking-tighter">
                        <span>Literal</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Top P</label>
                        <span className="text-[10px] font-mono font-bold bg-[var(--accent)] text-[var(--accent-text)] px-2 py-0.5 rounded-full">{formData.topP}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.topP}
                        onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                      />
                      <div className="flex justify-between text-[8px] text-neutral-600 font-bold uppercase tracking-tighter">
                        <span>Narrow</span>
                        <span>Broad</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Context Limit (tokens)</label>
                        <span className="text-[10px] font-mono font-bold bg-[var(--accent)] text-[var(--accent-text)] px-2 py-0.5 rounded-full">{formData.numCtx}</span>
                      </div>
                      <input
                        type="range"
                        min="512"
                        max="32768"
                        step="512"
                        value={formData.numCtx}
                        onChange={(e) => setFormData({ ...formData, numCtx: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                      />
                      <div className="flex justify-between text-[8px] text-neutral-600 font-bold uppercase tracking-tighter">
                        <span>512</span>
                        <span>32k</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="p-4 md:p-6 bg-black/[0.02] dark:bg-white/[0.02] border-t border-[var(--surface-border)] flex items-center justify-end gap-4 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-[10px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-[var(--text-main)] transition-all uppercase tracking-widest"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 rounded-xl text-[10px] font-bold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-80 shadow-xl shadow-[var(--accent)]/20 active:scale-[0.98] transition-all uppercase tracking-widest whitespace-nowrap"
            >
              Save Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

