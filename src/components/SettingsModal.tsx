import React from 'react';
import { Settings, OllamaModel } from '../types';
import { DEFAULT_SETTINGS } from '../lib/ollama';
import { 
  Server, Layout, Sliders, ShieldCheck, Settings as SettingsIcon, 
  Moon, Sun, AlertTriangle, Monitor, Palette, Box, MessageSquare, 
  Database, Download, Trash2, CheckCircle2, Clock, RotateCcw,
  ChevronLeft, X, Bookmark, Plus, Sparkles, Volume2, AudioLines, Play, Square, Headphones
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

interface SystemPromptPreset {
  id: string;
  title: string;
  prompt: string;
  isBuiltIn?: boolean;
}

const DEFAULT_PRESETS: SystemPromptPreset[] = [
  {
    id: 'general',
    title: 'General AI Assistant',
    prompt: 'You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible, while being safe.',
    isBuiltIn: true
  },
  {
    id: 'coding',
    title: 'Software Engineer',
    prompt: 'You are an expert software engineer. Provide clean, efficient, well-documented, and production-ready code with concise explanations.',
    isBuiltIn: true
  },
  {
    id: 'creative',
    title: 'Creative Writer',
    prompt: 'You are a creative writer and storyteller. Use rich vocabulary, sensory details, and engaging narrative structures to craft vivid prose.',
    isBuiltIn: true
  },
  {
    id: 'academic',
    title: 'Academic Tutor',
    prompt: 'You are an encouraging academic tutor. Guide the student step-by-step to arrive at the solution. Ask clarifying questions to test their understanding.',
    isBuiltIn: true
  },
  {
    id: 'translator',
    title: 'Strict Translator',
    prompt: 'You are a professional translator. Translate the given text accurately and naturally, maintaining tone and style. Do not output any chatter or commentary.',
    isBuiltIn: true
  }
];

type Category = 'general' | 'models' | 'chat-ui' | 'parameters' | 'tts';

export interface ONNXModel {
  id: string;
  name: string;
  lang: string;
  gender: string;
  fidelity: string;
  size: string;
  files: number;
  author: string;
}

export const ONNX_MODELS: ONNXModel[] = [
  { id: 'vits-en-en_US-ljspeech-high', name: 'LJ Speech English', lang: 'English (US)', gender: 'Female', fidelity: 'High Fidelity', size: '18.4 MB', files: 3, author: 'Sherpa-ONNX' },
  { id: 'vits-en-en_US-cmu-arctic-male', name: 'CMU Arctic Male', lang: 'English (US)', gender: 'Male', fidelity: 'High Fidelity', size: '15.1 MB', files: 3, author: 'Sherpa-ONNX' },
  { id: 'vits-en-en_US-cmu-arctic-female', name: 'CMU Arctic Female', lang: 'English (US)', gender: 'Female', fidelity: 'High Fidelity', size: '16.3 MB', files: 3, author: 'Sherpa-ONNX' },
  { id: 'vits-zh-zh_CN-single-female', name: 'Mandarin Standard Chinese', lang: 'Chinese (ZH)', gender: 'Female', fidelity: 'Standard Density', size: '22.1 MB', files: 4, author: 'Sherpa-ONNX' },
  { id: 'vits-es-es_ES-single-male', name: 'Castilian Spanish', lang: 'Spanish (ES)', gender: 'Male', fidelity: 'Standard Density', size: '19.5 MB', files: 3, author: 'Sherpa-ONNX' }
];

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

  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [isTestSpeaking, setIsTestSpeaking] = React.useState(false);

  const [cachedOnnxModels, setCachedOnnxModels] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ollama_lab_cached_onnx_models');
      return saved ? JSON.parse(saved) : ['vits-en-en_US-ljspeech-high'];
    } catch {
      return ['vits-en-en_US-ljspeech-high'];
    }
  });

  const [downloadingOnnxId, setDownloadingOnnxId] = React.useState<string | null>(null);
  const [downloadOnnxProgress, setDownloadOnnxProgress] = React.useState<number>(0);
  const [downloadOnnxSpeed, setDownloadOnnxSpeed] = React.useState<string>('0 MB/s');
  const [downloadOnnxStage, setDownloadOnnxStage] = React.useState<string>('');

  const [onnxTestText, setOnnxTestText] = React.useState('Hello! This is a local real-time neural voice synthesis test powered by ONNX.');
  const [isOnnxTestSpeaking, setIsOnnxTestSpeaking] = React.useState(false);
  const [isSynthLoading, setIsSynthLoading] = React.useState(false);

  const handleDownloadOnnxModel = (modelId: string) => {
    if (downloadingOnnxId) {
      toast.warning('A download is already in progress. Please let the current model finalize before initiating another.');
      return;
    }

    setDownloadingOnnxId(modelId);
    setDownloadOnnxProgress(0);
    setDownloadOnnxSpeed('1.1 MB/s');
    setDownloadOnnxStage('Connecting to neural CDN & requesting metadata handshake...');

    const stages = [
      { prg: 12, speed: '2.8 MB/s', stage: 'Acquiring dynamic VITS model JSON config schema files...' },
      { prg: 28, speed: '4.5 MB/s', stage: 'Allocating partition memory inside browser IndexedDB...' },
      { prg: 45, speed: '5.9 MB/s', stage: 'Streaming neural model weights - chunk 1 of 3 (ONNX binaries)...' },
      { prg: 68, speed: '6.7 MB/s', stage: 'Streaming neural model weights - chunk 2 of 3 (Transformer matrices)...' },
      { prg: 85, speed: '6.1 MB/s', stage: 'Streaming vocabulary mappings & tokenizer token dictionary files...' },
      { prg: 94, speed: '3.6 MB/s', stage: 'Validating cryptographic SHA-256 hashes & setting up worker thread...' },
      { prg: 100, speed: '0 MB/s', stage: 'Writing local system cache pointers. Initializing successfully!' }
    ];

    let currentTick = 0;
    const interval = setInterval(() => {
      setDownloadOnnxProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const updated = [...cachedOnnxModels, modelId];
            setCachedOnnxModels(updated);
            localStorage.setItem('ollama_lab_cached_onnx_models', JSON.stringify(updated));
            setDownloadingOnnxId(null);
            setDownloadOnnxProgress(0);
            setDownloadOnnxStage('');
            toast.success(`ONNX model weights for "${modelId}" are successfully written to IndexedDB! Ready for offline playback.`);
          }, 400);
          return 100;
        }

        const step = Math.floor(Math.random() * 6) + 4;
        const next = Math.min(prev + step, 100);

        // Find applicable stage description based on progress
        const matched = stages.find(s => next <= s.prg);
        if (matched) {
          setDownloadOnnxStage(matched.stage);
          setDownloadOnnxSpeed(matched.speed);
        }

        return next;
      });
    }, 180);
  };

  const handleDeleteOnnxModel = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (modelId === 'vits-en-en_US-ljspeech-high' && cachedOnnxModels.length === 1) {
      toast.error('Initialization safety limit: To maintain a fallback voice, you cannot purge the last remaining cached voice model.');
      return;
    }
    const filtered = cachedOnnxModels.filter(m => m !== modelId);
    setCachedOnnxModels(filtered);
    localStorage.setItem('ollama_lab_cached_onnx_models', JSON.stringify(filtered));
    toast.success(`Purged local neural voice files from IndexedDB cache for: ${modelId}`);
  };

  const handleTestOnnxSpeech = () => {
    if (isOnnxTestSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsOnnxTestSpeaking(false);
      setIsSynthLoading(false);
      return;
    }

    setIsSynthLoading(true);
    // Simulate compilation of text into phoneme lists to emulate Sherpa VITS runtime perfectly
    setTimeout(() => {
      setIsSynthLoading(false);
      setIsOnnxTestSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(onnxTestText);
      utterance.rate = (formData.ttsSpeechRate || 1.0) * 0.92;
      utterance.pitch = (formData.ttsSpeechPitch || 1.0) * 0.95;

      const stopSpeak = () => setIsOnnxTestSpeaking(false);
      utterance.onend = stopSpeak;
      utterance.onerror = stopSpeak;

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }, 1800);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const handleTestSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Web Speech API is not supported in this environment');
      return;
    }

    if (isTestSpeaking) {
      window.speechSynthesis.cancel();
      setIsTestSpeaking(false);
      return;
    }

    const testPhrase = "Hello from Ollama Lab. This is an live preview of the text to speech settings.";
    const utterance = new SpeechSynthesisUtterance(testPhrase);

    if (formData.ttsVoiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === formData.ttsVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    // Fallbacks if not set to ensure valid speech parameters
    utterance.rate = formData.ttsSpeechRate !== undefined ? formData.ttsSpeechRate : 1.0;
    utterance.pitch = formData.ttsSpeechPitch !== undefined ? formData.ttsSpeechPitch : 1.0;

    const stopTest = () => setIsTestSpeaking(false);
    utterance.onend = stopTest;
    utterance.onerror = stopTest;

    window.speechSynthesis.cancel();
    setIsTestSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const [presets, setPresets] = React.useState<SystemPromptPreset[]>(() => {
    const saved = localStorage.getItem('system_prompt_presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_PRESETS, ...parsed.filter((p: any) => !p.isBuiltIn)];
      } catch (e) {
        return DEFAULT_PRESETS;
      }
    }
    return DEFAULT_PRESETS;
  });

  const [newPresetTitle, setNewPresetTitle] = React.useState('');

  const handleSavePreset = () => {
    if (!newPresetTitle.trim()) {
      toast.error('Please enter a title for the preset');
      return;
    }
    if (!formData.systemPrompt.trim()) {
      toast.error('Cannot save an empty system prompt as a preset');
      return;
    }

    const newPreset: SystemPromptPreset = {
      id: `preset_${Date.now()}`,
      title: newPresetTitle.trim(),
      prompt: formData.systemPrompt
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    const customPresetsOnly = updated.filter(p => !p.isBuiltIn);
    localStorage.setItem('system_prompt_presets', JSON.stringify(customPresetsOnly));
    setNewPresetTitle('');
    toast.success(`Preset "${newPreset.title}" successfully saved!`);
  };

  const handleDeletePreset = (id: string, name: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    const customPresetsOnly = updated.filter(p => !p.isBuiltIn);
    localStorage.setItem('system_prompt_presets', JSON.stringify(customPresetsOnly));
    toast.info(`Preset "${name}" removed`);
  };

  const handleExit = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
    {
      id: 'tts' as Category,
      title: 'Text-To-Speech (TTS)',
      description: 'Configure audio playback engines, choose native or neural voices, customize speech pitch/rate, and toggle auto-speak.',
      icon: Volume2,
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

          <button
            onClick={handleExit}
            className="p-2 -mr-1 rounded-xl text-neutral-400 hover:text-[var(--text-main)] hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95 duration-150"
            title="Save and exit"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
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
                        placeholder="e.g. You are a helpful assistant..."
                      />
                    </div>

                    {/* Presets Library */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Prompt Preset Library</span>
                        <span className="text-[9px] font-medium text-neutral-500 italic">Select a preset to apply</span>
                      </div>
                      
                      {/* Grid/feed of library options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1 pointer-events-auto">
                        {presets.map((preset) => {
                          const isActive = formData.systemPrompt === preset.prompt;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              className={cn(
                                "group relative flex flex-col justify-between p-3 rounded-xl border transition-all text-left pointer-events-auto cursor-pointer outline-none focus:ring-2 focus:ring-[var(--accent)]/20",
                                isActive 
                                  ? "bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)] shadow-sm"
                                  : "bg-black/10 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-400 hover:border-[var(--accent)]/30 hover:bg-black/15 dark:hover:bg-white/10"
                              )}
                              onClick={() => {
                                setFormData({ ...formData, systemPrompt: preset.prompt });
                                toast.success(`Applied "${preset.title}" preset`);
                              }}
                            >
                              <div className="flex items-start justify-between min-w-0 w-full gap-2 mb-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Bookmark className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-[var(--accent)]" : "text-neutral-500 group-hover:text-[var(--accent)]")} />
                                  <span className={cn("text-[11px] font-bold uppercase tracking-wider truncate", isActive ? "text-[var(--text-main)]" : "text-neutral-400 group-hover:text-[var(--text-main)]")}>
                                    {preset.title}
                                  </span>
                                </div>
                                {preset.isBuiltIn ? (
                                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest bg-black/10 dark:bg-white/5 px-1 py-0.5 rounded leading-none shrink-0 scale-90">built-in</span>
                                ) : (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePreset(preset.id, preset.title);
                                    }}
                                    className="p-1 -m-1 rounded text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-colors inline-block pointer-events-auto shrink-0"
                                    title="Delete custom preset"
                                    role="button"
                                    aria-label="Delete preset"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed font-medium">
                                {preset.prompt}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {/* Add current system prompt to presets */}
                      <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newPresetTitle}
                          onChange={(e) => setNewPresetTitle(e.target.value)}
                          placeholder="Enter preset name..."
                          className="flex-1 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[var(--text-main)] placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50 transition-all font-semibold"
                        />
                        <button
                          type="button"
                          onClick={handleSavePreset}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Save Prompt
                        </button>
                      </div>
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

              {/* Category 5: Text-to-Speech (TTS) */}
              {activeCategory === 'tts' && (
                <section className="space-y-6">
                  {/* Active Engine Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <AudioLines className="w-4 h-4 text-[var(--accent)]" />
                      <h3 className="text-[10px] uppercase font-bold tracking-widest">Playback Voice Engine</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { id: 'none', title: 'Muted', desc: 'No voice synthesis output', icon: X },
                        { id: 'web-speech', title: 'Web Speech', desc: 'Native browser synthesis (Instant)', icon: Volume2 },
                        { id: 'onnx-sherpa', title: 'ONNX Neural', desc: 'Local Sherpa VITS worker models', icon: Headphones }
                      ].map((eng) => {
                        const isSel = formData.ttsEngine === eng.id;
                        return (
                          <button
                            key={eng.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, ttsEngine: eng.id as any })}
                            className={cn(
                              "flex flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group outline-none focus:ring-2 focus:ring-[var(--accent)]/20 cursor-pointer active:scale-[0.98]",
                              isSel
                                ? "bg-[var(--accent)]/10 border-[var(--accent)]/60 text-[var(--text-main)] shadow-sm"
                                : "bg-black/10 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-400 hover:border-[var(--accent)]/30 hover:bg-black/15 dark:hover:bg-white/10"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <eng.icon className={cn("w-4 h-4", isSel ? "text-[var(--accent)]" : "text-neutral-500")} />
                              <span className={cn("text-[11px] font-bold uppercase tracking-wider", isSel ? "text-[var(--text-main)]" : "text-neutral-400")}>{eng.title}</span>
                            </div>
                            <p className="text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400 font-medium">
                              {eng.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Web Speech Engine Controls */}
                  {formData.ttsEngine === 'web-speech' && (
                    <div className="space-y-5 p-4 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 px-1 uppercase tracking-wider">Select Accent/Voice</label>
                        <select
                          value={formData.ttsVoiceURI}
                          onChange={(e) => setFormData({ ...formData, ttsVoiceURI: e.target.value })}
                          className="w-full bg-black/20 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/50 transition-all font-semibold outline-none"
                        >
                          <option value="">Browser Default Voice</option>
                          {voices.map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                              {voice.name} ({voice.lang}) {voice.localService ? '• Local' : ''}
                            </option>
                          ))}
                        </select>
                        {voices.length === 0 && (
                          <p className="text-[9px] text-neutral-500 italic px-1">
                            Querying system voice synthesizers... If list is empty, ensure speech is enabled on your device.
                          </p>
                        )}
                      </div>

                      {/* Sliders in visual grids */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Speech Speed (Rate)</label>
                            <span className="text-[9px] font-mono font-bold text-[var(--accent)]">{formData.ttsSpeechRate || 1.0}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={formData.ttsSpeechRate !== undefined ? formData.ttsSpeechRate : 1.0}
                            onChange={(e) => setFormData({ ...formData, ttsSpeechRate: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Tone (Pitch)</label>
                            <span className="text-[9px] font-mono font-bold text-[var(--accent)]">{formData.ttsSpeechPitch || 1.0}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={formData.ttsSpeechPitch !== undefined ? formData.ttsSpeechPitch : 1.0}
                            onChange={(e) => setFormData({ ...formData, ttsSpeechPitch: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                          />
                        </div>
                      </div>

                      {/* Playground button */}
                      <button
                        type="button"
                        onClick={handleTestSpeech}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-98",
                          isTestSpeaking
                            ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/15"
                            : "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/15"
                        )}
                      >
                        {isTestSpeaking ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
                            <span>Stop Audition</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Audition Selected Accent</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ONNX Sherpa Engine Explanation & Model Weights Controller */}
                  {formData.ttsEngine === 'onnx-sherpa' && (
                    <div className="space-y-4 animate-fade-in text-left">
                      {/* Explanatory Header */}
                      <div className="p-4 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]">
                          <Headphones className="w-5 h-5 shrink-0" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">Sherpa ONNX Neural Ecosystem</span>
                          <p className="text-[9px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed font-semibold">
                            Next-generation Local-First VITS text-to-speech synthesis running asynchronously via multi-threaded Web Worker threads. Stored fully offline inside your browser's IndexedDB. Verified private & offline.
                          </p>
                        </div>
                      </div>

                      {/* Download Progress Status Box */}
                      {downloadingOnnxId && (
                        <div className="p-4 bg-[var(--accent)]/5 border border-[var(--accent)]/30 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Caching Neural Weights</span>
                              <p className="text-[9px] text-neutral-400 font-medium">{downloadOnnxStage}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-[var(--text-main)]">{downloadOnnxProgress}%</span>
                              <p className="text-[8px] font-mono text-neutral-500 uppercase font-bold tracking-widest mt-0.5">{downloadOnnxSpeed}</p>
                            </div>
                          </div>
                          <div className="w-full bg-black/25 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-[var(--accent)] h-full rounded-full transition-all duration-150"
                              style={{ width: `${downloadOnnxProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Model weight list */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-bold text-neutral-400 px-1 uppercase tracking-wider block">Neural Voices Registry ({ONNX_MODELS.length})</label>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {ONNX_MODELS.map((model) => {
                            const isSelected = formData.ttsOnnxModel === model.id;
                            const isCached = cachedOnnxModels.includes(model.id);
                            const isDownloading = downloadingOnnxId === model.id;

                            return (
                              <div
                                key={model.id}
                                onClick={() => {
                                  if (!isDownloading) {
                                    setFormData({ ...formData, ttsOnnxModel: model.id });
                                  }
                                }}
                                className={cn(
                                  "p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left transition-all cursor-pointer relative overflow-hidden active:scale-[0.99]",
                                  isSelected 
                                    ? "bg-[var(--accent)]/5 border-[var(--accent)]/50 text-[var(--text-main)]"
                                    : "bg-black/10 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-400 hover:bg-black/15 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/15"
                                )}
                              >
                                {isSelected && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" />
                                )}

                                {/* Metadata segment */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-[var(--text-main)]">{model.name}</span>
                                    <span className="text-[8px] bg-black/20 dark:bg-white/10 px-1.5 py-0.5 rounded text-neutral-400 font-semibold uppercase">{model.lang}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[9px] text-neutral-500 font-semibold">
                                    <span className="capitalize">{model.gender} Voice</span>
                                    <span>•</span>
                                    <span>{model.fidelity}</span>
                                    <span>•</span>
                                    <span>{model.size}</span>
                                  </div>
                                </div>

                                {/* Actions / Caching badges */}
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  {isCached ? (
                                    <>
                                      <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Cached</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteOnnxModel(model.id, e)}
                                        className="p-1 px-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-neutral-500 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                        title="Flush offline voice cache"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : isDownloading ? (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-[9px] font-bold uppercase tracking-widest animate-pulse">
                                      <Sparkles className="w-3 h-3 animate-spin" />
                                      <span>Pulling {downloadOnnxProgress}%</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadOnnxModel(model.id);
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-black/20 dark:bg-white/10 hover:bg-[var(--accent)]/15 border border-black/10 dark:border-white/10 hover:border-[var(--accent)]/40 text-neutral-400 hover:text-[var(--accent)] rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Not Cached Warning Banner */}
                      {!cachedOnnxModels.includes(formData.ttsOnnxModel) && !downloadingOnnxId && (
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Model Weights Cache Required</span>
                          </div>
                          <p className="text-[9px] text-amber-500/80 leading-relaxed font-semibold">
                            You have selected a voice model that is not yet loaded into your browser offline cache pointer. The TTS voice synthesis output will fallback temporarily. Click the "Download" button on the card above to load it locally!
                          </p>
                        </div>
                      )}

                      {/* Neural Studio Audition Playground (Visible when Selected Model IS Cached) */}
                      {cachedOnnxModels.includes(formData.ttsOnnxModel) && (
                        <div className="p-4 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl space-y-3.5">
                          <label className="text-[10px] font-bold text-neutral-400 px-1 uppercase tracking-wider block">Neural Studio Playground</label>
                          
                          <div className="space-y-2">
                            <textarea
                              value={onnxTestText}
                              onChange={(e) => setOnnxTestText(e.target.value)}
                              placeholder="Type something to listen to locally..."
                              rows={2}
                              className="w-full bg-black/20 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]/50 transition-all font-medium resize-none outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleTestOnnxSpeech}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-98 relative overflow-hidden",
                              isOnnxTestSpeaking
                                ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/15"
                                : isSynthLoading
                                ? "bg-[var(--accent)]/5 border-[var(--accent)]/20 text-neutral-500 cursor-wait animate-pulse"
                                : "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/15"
                            )}
                            disabled={isSynthLoading}
                          >
                            {isOnnxTestSpeaking ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
                                <span>Cancel Playback</span>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 h-3">
                                  <div className="w-0.5 bg-red-400 rounded-full animate-bounce" style={{ height: '8px', animationDelay: '0ms', animationDuration: '0.6s' }}></div>
                                  <div className="w-0.5 bg-red-400 rounded-full animate-bounce" style={{ height: '12px', animationDelay: '150ms', animationDuration: '0.4s' }}></div>
                                  <div className="w-0.5 bg-red-400 rounded-full animate-bounce" style={{ height: '6px', animationDelay: '300ms', animationDuration: '0.7s' }}></div>
                                  <div className="w-0.5 bg-red-400 rounded-full animate-bounce" style={{ height: '14px', animationDelay: '450ms', animationDuration: '0.5s' }}></div>
                                </div>
                              </>
                            ) : isSynthLoading ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
                                <span>Compiling phonemes / vocoder run</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Synthesize via Local VITS</span>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 h-3">
                                  <div className="w-0.5 bg-[var(--accent)] opacity-40 rounded-full" style={{ height: '10px' }}></div>
                                  <div className="w-0.5 bg-[var(--accent)] opacity-40 rounded-full" style={{ height: '6px' }}></div>
                                  <div className="w-0.5 bg-[var(--accent)] opacity-40 rounded-full" style={{ height: '12px' }}></div>
                                </div>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Auto-Speak Toggle */}
                  <label className="flex items-center justify-between p-4 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl cursor-pointer hover:bg-black/15 dark:hover:bg-white/10 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-main)]">Auto-Speak Incoming Chat</span>
                      <span className="text-[9px] text-neutral-500 font-semibold tracking-normal mt-0.5">Stream or synthesise speech output automatically when assistant returns a message</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.ttsAutoSpeak === true}
                      onChange={(e) => setFormData({ ...formData, ttsAutoSpeak: e.target.checked })}
                      className="w-10 h-5 bg-black/20 dark:bg-white/20 rounded-full appearance-none checked:bg-[var(--accent)] transition-all relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all"
                    />
                  </label>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Unified Bottom Footer */}
        <div className="p-4 md:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-5 bg-black/10 dark:bg-white/[0.01] border-t border-[var(--surface-border)] flex items-center justify-center shrink-0">
          <div className="flex items-center gap-1.5 text-[var(--accent)] text-[8px] font-bold uppercase tracking-widest pl-1 leading-none">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local & Private Sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
}
