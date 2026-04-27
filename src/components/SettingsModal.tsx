import React from 'react';
import { Settings } from '../types';
import { X, Server, Layout, Sliders, Info, ShieldCheck, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [formData, setFormData] = React.useState<Settings>({ ...settings });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[var(--surface)] backdrop-blur-2xl w-full max-w-xl rounded-3xl border border-[var(--surface-border)] shadow-2xl overflow-hidden shadow-black/20 dark:shadow-black/60 transition-colors duration-300"
      >
        <div className="p-6 border-b border-[var(--surface-border)] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[var(--text-main)] tracking-tight">Engine Configuration</h2>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Local Instance Optimized</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-neutral-500 hover:text-[var(--text-main)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8 bg-gradient-to-b from-black/[0.01] dark:from-white/[0.02] to-transparent">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-500">
                <Sun className="w-4 h-4" />
                <h3 className="text-[10px] uppercase font-bold tracking-widest">Interface Theme</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center group",
                    formData.theme === t.id 
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                      : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-500 hover:border-blue-500/50"
                  )}
                >
                  <t.icon className={cn("w-5 h-5 transition-colors", formData.theme === t.id ? "text-white" : "text-neutral-400 group-hover:text-blue-500")} />
                  <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{t.name}</span>
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
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-mono shadow-inner"
                placeholder="http://localhost:11434"
              />
              <div className="flex items-center gap-3 mt-3 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-[10px] leading-tight font-medium">
                  Verify <code className="bg-blue-500/20 px-1 rounded text-white">OLLAMA_ORIGINS="*"</code> is enabled in your environment.
                </p>
              </div>
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
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all min-h-[100px] resize-none shadow-inner"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-neutral-500">
              <Sliders className="w-4 h-4" />
              <h3 className="text-[10px] uppercase font-bold tracking-widest">Neural Parameters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Temperature</label>
                   <span className="text-[10px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">{formData.temperature}</span>
                 </div>
                 <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[8px] text-neutral-600 font-bold uppercase tracking-tighter">
                  <span>Literal</span>
                  <span>Creative</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Top P</label>
                   <span className="text-[10px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">{formData.topP}</span>
                </div>
                 <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.topP}
                  onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                 <div className="flex justify-between text-[8px] text-neutral-600 font-bold uppercase tracking-tighter">
                  <span>Narrow</span>
                  <span>Broad</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border-t border-[var(--surface-border)] flex items-center justify-between">
           <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 text-[9px] font-bold uppercase tracking-widest">
             <ShieldCheck className="w-3.5 h-3.5" />
             End-to-End Local Privacy
           </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-[var(--text-main)] transition-all uppercase tracking-widest"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all uppercase tracking-widest"
            >
              Save Pipeline
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

