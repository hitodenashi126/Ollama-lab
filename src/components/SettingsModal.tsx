import React from 'react';
import { Settings, OllamaModel } from '../types';
import { DEFAULT_SETTINGS } from '../lib/ollama';
import { 
  Server, Layout, Sliders, ShieldCheck, Settings as SettingsIcon, 
  Moon, Sun, AlertTriangle, Monitor, Palette, Box, MessageSquare, 
  Database, Download, Trash2, CheckCircle2, Clock, RotateCcw,
  ChevronLeft
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
  const [activeCategory, setActiveCategory] = React.useState<Category | null>(null);
  const [newModelName, setNewModelName] = React.useState('');

  const handleExit = () => {
    onSave(formData);
    toast.success('Configuration autosaved');
    onClose();
  };

  const handleRestoreDefaults = () => {
    if (confirm('Restore all settings to default values? This will reset your theme, accent color, and model parameters.')) {
      setFormData({ ...DEFAULT_SETTINGS });
      toast.info('Settings restored to defaults');
    }
  };

  // Modern dashboard cards representing settings categories
  const dashboardCards = [
    {
      id: 'general' as Category,
      title: 'Workspace & Persona',
      description: 'Configure interface themes, custom accent colors, connectivity endpoints, and system instructions.',
      icon: Monitor,
    },
    {
      id: 'models' as Category,
      title: 'Models & Engine',
      description: 'Pull high-speed weights, view local models, and manage active neural backends.',
      icon: Database,
    },
    {
      id: 'chat-ui' as Category,
      title: 'Chat Customizer',
      description: 'Toggle boxed bubbles, customize body typography, and hide/show details.',
      icon: Palette,
    },
    {
      id: 'parameters' as Category,
      title: 'Neural Parameters',
      description: 'Fine-tune temperature profiles, dynamic top-P values, and context limits.',
      icon: Sliders,
    },
  ];

  const currentCategoryName = dashboardCards.find(c => c.id === activeCategory)?.title || '';

  // Theme adapter for dot grids
  const isDark = formData.theme.includes('dark');
  const dotColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const dotGridStyle = {
    backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`,
    backgroundSize: '14px 14px',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div
        onClick={handleExit}
        className="absolute inset-0 bg-black/75 backdrop-blur-md animate-fade-in"
      />
      <div
        className="relative bg-[var(--surface)] backdrop-blur-3xl w-full h-full sm:h-[min(640px,calc(100dvh-2rem))] sm:max-w-2xl sm:rounded-2xl rounded-none border-0 sm:border border-[var(--surface-border)] shadow-2xl overflow-hidden flex flex-col shadow-black/80 transition-all duration-300 animate-scale-in"
      >
        {/* Header Panel */}
        <div className="p-5 md:p-6 border-b border-[var(--surface-border)] flex items-center justify-between shrink-0 bg-black/10 dark:bg-white/[0.01]">
          {activeCategory === null ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <SettingsIcon className="w-4.5 h-4.5" />
              </div>
              <h2 className="font-bold text-sm text-[var(--text-main)] uppercase tracking-[0.1em]">Settings</h2>
            </div>
          ) : (
            <button 
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 text-neutral-400 hover:text-[var(--text-main)] transition-all font-bold text-xs uppercase tracking-widest group"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-400 transition-transform group-hover:-translate-x-0.5" />
              <span>Settings</span>
              <span className="text-neutral-600 dark:text-neutral-500 font-normal">/</span>
              <span className="text-[var(--accent)] font-bold">{currentCategoryName}</span>
            </button>
          )}
        </div>

        {/* Core Scrolling Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar bg-transparent">
          {activeCategory === null ? (
            <div className="space-y-4 animate-scale-in">
              <div className="px-1 py-1">
                <p className="text-[11px] text-neutral-400 font-medium">Select a system module to open and fine-tune your configuration workspace.</p>
              </div>

              {/* Vertical Card Feed modeled exactly on the reference image */}
              <div className="space-y-4">
                {dashboardCards.map((card) => {
                  const CardIcon = card.icon;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setActiveCategory(card.id)}
                      className="group relative w-full text-left p-5 md:p-6 rounded-2xl bg-black/20 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 hover:border-[var(--accent)]/40 transition-all duration-300 shadow-xl overflow-hidden flex items-center justify-between active:scale-[0.99] hover:bg-black/30 dark:hover:bg-white/[0.04]"
                    >
                      {/* Dotted mesh grid absolute layer */}
                      <div 
                        className="absolute inset-0 pointer-events-none" 
                        style={dotGridStyle}
                      />
                      
                      {/* Dynamic accent background hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      <div className="relative z-10 flex-1 pr-8">
                        <h3 className="text-base font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors tracking-tight">
                          {card.title}
                        </h3>
                        <p className="text-xs text-neutral-400 dark:text-neutral-400 mt-1.5 leading-relaxed tracking-normal transition-colors group-hover:text-neutral-300 dark:group-hover:text-neutral-300 font-medium max-w-[85%] md:max-w-[78%]">
                          {card.description}
                        </p>
                      </div>

                      {/* Massive watermarked icon in background aligned to right */}
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.03] text-[var(--accent)] pointer-events-none transition-all duration-500 group-hover:scale-105 group-hover:opacity-[0.14] dark:group-hover:opacity-[0.08]" style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}>
                        <CardIcon size={80} strokeWidth={1} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-scale-in">
              {/* Category 1: Workspace & Persona */}
              {activeCategory === 'general' && (
                <>
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Sun className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">Interface Theme</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'glass-dark', name: 'Glass Dark', icon: Moon },
                        { id: 'glass-light', name: 'Glass Light', icon: Sun },
                        { id: 'solid-dark', name: 'AMOLED Black', icon: Moon },
                        { id: 'solid-light', name: 'Classic Light', icon: Sun },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setFormData({ ...formData, theme: t.id as any })}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center group active:scale-[0.98]",
                            formData.theme === t.id 
                              ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)] shadow-lg shadow-[var(--accent)]/20" 
                              : "bg-black/10 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-500 hover:border-[var(--accent)]/50"
                          )}
                        >
                          <t.icon className={cn("w-4.5 h-4.5 transition-colors", formData.theme === t.id ? "text-[var(--accent-text)]" : "text-neutral-400 group-hover:text-[var(--accent)]")} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Palette className="w-4 h-4 text-[var(--accent)]" />
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
                            "w-9 h-9 rounded-full border-4 transition-all flex items-center justify-center",
                            formData.accentColor === p.color 
                              ? "border-[var(--accent)]/40 scale-110 shadow-lg" 
                              : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        >
                          {formData.accentColor === p.color && <CheckCircle2 className="w-4.5 h-4.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Server className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">Connectivity</h3>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 px-1 uppercase tracking-wider">Ollama API Endpoint</label>
                      <input
                        type="text"
                        value={formData.baseUrl}
                        onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                        className="w-full bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/50 transition-all font-mono"
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Layout className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">Global Persona</h3>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 px-1 uppercase tracking-wider">System Instructions</label>
                      <textarea
                        value={formData.systemPrompt}
                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                        className="w-full bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/50 transition-all min-h-[100px] resize-none"
                      />
                    </div>
                  </section>

                  <section className="space-y-4 pt-4 border-t border-[var(--surface-border)]">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">System Maintenance</h3>
                    </div>
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Factory Reset</span>
                        <p className="text-[9px] text-neutral-500 font-medium leading-relaxed">
                          This will revert all settings, themes, and model parameters to their original states. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={handleRestoreDefaults}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all uppercase tracking-widest active:scale-95 w-full justify-center"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore Factory Defaults
                      </button>
                    </div>
                  </section>
                </>
              )}

              {/* Category 2: Models & Engine */}
              {activeCategory === 'models' && (
                <>
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Download className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">Pull New Model</h3>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          placeholder="e.g. llama3, mistral, deepseek-coder"
                          className="w-full bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/50 transition-all text-sm"
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
                        className="px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 active:scale-95 transition-all outline-none"
                      >
                        Pull
                      </button>
                    </div>
                    {pullProgress && (
                      <div className="p-4 bg-[var(--accent)]/15 border border-[var(--accent)]/30 rounded-xl space-y-2 animate-fade-in">
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
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Database className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">Installed Models</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                      {models.map((model) => (
                        <div 
                          key={model.name}
                          className="flex items-center justify-between p-3 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl group hover:border-[var(--accent)]/30 transition-all duration-150"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                              <Box className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[var(--text-main)]">{model.name}</span>
                              <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold mt-0.5">
                                {formatSize(model.size)} • {model.details.parameter_size}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteModel(model.name)}
                            className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
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

              {/* Category 3: Chat Customizer */}
              {activeCategory === 'chat-ui' && (
                <>
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
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
                            "flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left group active:scale-[0.98]",
                            formData.chatStyle === s.id 
                              ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)] shadow-lg shadow-[var(--accent)]/20" 
                              : "bg-black/10 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-500 hover:border-[var(--accent)]/50"
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
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Layout className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">Body Typography</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'sans', name: 'Sans', description: 'Modern Inter' },
                        { id: 'serif', name: 'Serif', description: 'Lora Georgia' },
                        { id: 'mono', name: 'Mono', description: 'Fira Code' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFormData({ ...formData, fontFamily: f.id as any })}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center group active:scale-[0.98]",
                            formData.fontFamily === f.id 
                              ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-text)] shadow-lg shadow-[var(--accent)]/15" 
                              : "bg-black/10 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-500 hover:border-[var(--accent)]/50"
                          )}
                        >
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest mb-1",
                            f.id === 'sans' ? 'font-sans' : f.id === 'serif' ? 'font-serif' : 'font-mono'
                          )}>
                            {f.name}
                          </span>
                          <span className="text-[8px] opacity-70 font-medium">{f.description}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 px-1 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Font Size</label>
                        <span className="text-[10px] font-mono font-bold bg-[var(--accent)] text-[var(--accent-text)] px-2 py-0.5 rounded-full">{formData.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="20"
                        step="1"
                        value={formData.fontSize}
                        onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Clock className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">Extra Information</h3>
                    </div>
                    <label className="flex items-center justify-between p-4 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl cursor-pointer hover:bg-black/15 dark:hover:bg-white/10 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">Show Timestamps</span>
                        <span className="text-[9px] text-neutral-500 font-semibold tracking-normal mt-0.5">Display when messages were sent</span>
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

              {/* Category 4: Neural Parameters */}
              {activeCategory === 'parameters' && (
                <section className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Sliders className="w-4 h-4 text-[var(--accent)]" />
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

                      <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                        <label className="flex items-center justify-between p-4 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl cursor-pointer hover:bg-black/15 dark:hover:bg-white/10 transition-all">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">Model Reasoning (Ollama API)</span>
                            <span className="text-[9px] text-neutral-500 font-semibold tracking-normal mt-0.5">Pass thinking parameter to the Ollama server to enable or disable internal reasoning</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.enableOllamaReasoning !== false}
                            onChange={(e) => setFormData({ ...formData, enableOllamaReasoning: e.target.checked })}
                            className="w-10 h-5 bg-black/20 dark:bg-white/20 rounded-full appearance-none checked:bg-[var(--accent)] transition-all relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl cursor-pointer hover:bg-black/15 dark:hover:bg-white/10 transition-all">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">Show Model Thinking</span>
                            <span className="text-[9px] text-neutral-500 font-semibold tracking-normal mt-0.5">Show or hide the expandable &lt;think&gt; process panel for models like DeepSeek-R1</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.showThinking !== false}
                            onChange={(e) => setFormData({ ...formData, showThinking: e.target.checked })}
                            className="w-10 h-5 bg-black/20 dark:bg-white/20 rounded-full appearance-none checked:bg-[var(--accent)] transition-all relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Unified Bottom Footer */}
        <div className="p-4 md:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-5 bg-black/10 dark:bg-white/[0.01] border-t border-[var(--surface-border)] flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-1.5 text-[var(--accent)] text-[8px] font-bold uppercase tracking-widest pl-1 leading-none">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Local & Private Sandbox</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExit}
              className="px-7 py-3 rounded-xl text-[10px] font-bold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 shadow-xl shadow-[var(--accent)]/15 active:scale-[0.98] transition-all uppercase tracking-widest whitespace-nowrap outline-none cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
