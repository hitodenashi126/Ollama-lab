import React, { useState } from 'react';
import { Terminal, RefreshCw, Check, Copy, WifiOff, Monitor, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface OllamaTroubleshooterProps {
  onRetry: () => Promise<void>;
  baseUrl: string;
  onOpenSettings: () => void;
}

type OSTab = 'windows' | 'macos' | 'linux';

export const OllamaTroubleshooter: React.FC<OllamaTroubleshooterProps> = ({
  onRetry,
  baseUrl,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<OSTab>('windows');
  const [isRetrying, setIsRetrying] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRetryWithLoading = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    toast.info('Checking connection to Ollama local instance...');
    try {
      await onRetry();
    } finally {
      // Small timeout to give feedback
      setTimeout(() => {
        setIsRetrying(false);
      }, 500);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-5 md:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--surface-border)] shadow-2xl backdrop-blur-3xl animate-scale-in text-neutral-300 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--surface-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--text-main)] uppercase tracking-[0.1em]">Ollama Connection Assistant</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">We could not establish a connection to Ollama at <code className="text-[var(--accent)] font-mono font-semibold">{baseUrl}</code></p>
          </div>
        </div>

        <button
          onClick={handleRetryWithLoading}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRetrying && "animate-spin")} />
          {isRetrying ? 'Retrying...' : 'Retry Connection'}
        </button>
      </div>

      {/* Primary Explanation */}
      <div className="space-y-2 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[11px] leading-relaxed text-amber-200/95 font-medium">
        <p>
          <strong>Why is this happening?</strong> Modern browsers block security-sensitive requests from remote websites to local hosts (like <code className="bg-amber-950/40 text-amber-300 font-mono px-1 rounded">localhost:11434</code>) unless Cross-Origin Resource Sharing (CORS) is explicitly enabled on your local machine.
        </p>
      </div>

      {/* Troubleshooting Guides */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Step-by-step CORS setup guide</h4>
          
          <div className="flex rounded-lg bg-black/20 p-0.5 border border-[var(--surface-border)] gap-0.5">
            {(['windows', 'macos', 'linux'] as OSTab[]).map((os) => (
              <button
                key={os}
                onClick={() => setActiveTab(os)}
                className={cn(
                  "px-2 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all",
                  activeTab === os
                    ? "bg-[var(--accent)] text-[var(--accent-text)] shadow"
                    : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                {os === 'windows' ? 'Windows' : os === 'macos' ? 'macOS' : 'Linux'}
              </button>
            ))}
          </div>
        </div>

        {/* Windows Guide */}
        {activeTab === 'windows' && (
          <div className="space-y-3 animate-fade-in">
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">1</span>
                <p className="text-[11px] leading-relaxed">
                  Close Ollama completely from your System Tray / Taskbar (right-click the <strong className="text-white">Ollama tray icon</strong> and click <strong className="text-red-400">Quit Ollama</strong>).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">2</span>
                <p className="text-[11px] leading-relaxed">
                  Open the Windows Start Menu, search for <strong className="text-white">"Environment Variables"</strong>, and select <strong className="text-white">"Edit the system environment variables"</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">3</span>
                <p className="text-[11px] leading-relaxed">
                  Under <strong className="text-white">User Variables</strong> (or System Variables), click <strong className="text-white">"New..."</strong> and configure:
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-[var(--surface-border)] rounded-xl p-3.5 space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">Variable Name</span>
                <button
                  onClick={() => handleCopy('OLLAMA_ORIGINS', 'Variable Name')}
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-all"
                >
                  {copiedText === 'OLLAMA_ORIGINS' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
              </div>
              <div className="text-blue-400 font-bold tracking-wide">OLLAMA_ORIGINS</div>
              
              <hr className="border-white/5 my-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">Variable Value</span>
                <button
                  onClick={() => handleCopy('*', 'Variable Value')}
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-all"
                >
                  {copiedText === '*' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
              </div>
              <div className="text-green-400 font-bold tracking-wide">*</div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">4</span>
              <p className="text-[11px] leading-relaxed">
                Click <strong className="text-white">OK</strong> to save, launch <strong className="text-white">Ollama</strong> again from your desktop/Start Menu, and click the retry button above.
              </p>
            </div>
          </div>
        )}

        {/* macOS Guide */}
        {activeTab === 'macos' && (
          <div className="space-y-3 animate-fade-in text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">1</span>
              <p className="text-[11px] leading-relaxed">
                Quit <strong className="text-white">Ollama app</strong> from the menu bar status icon.
              </p>
            </div>
            
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">2</span>
              <p className="text-[11px] leading-relaxed">
                Launch your <strong className="text-white">Terminal.app</strong> (Command + Space, search "Terminal") and run the configuration script:
              </p>
            </div>

            <div className="bg-black/40 border border-[var(--surface-border)] rounded-xl p-3.5 font-mono text-[11px] flex justify-between items-center gap-4">
              <span className="text-green-400 text-left truncate">launchctl setenv OLLAMA_ORIGINS "*"</span>
              <button
                onClick={() => handleCopy('launchctl setenv OLLAMA_ORIGINS "*"', 'Script command')}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-all shrink-0"
              >
                {copiedText === 'launchctl setenv OLLAMA_ORIGINS "*"' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                Copy Command
              </button>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">3</span>
              <p className="text-[11px] leading-relaxed">
                Start <strong className="text-white">Ollama</strong> again from your Applications folder, and press the retry button.
              </p>
            </div>
          </div>
        )}

        {/* Linux Guide */}
        {activeTab === 'linux' && (
          <div className="space-y-3 animate-fade-in text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">1</span>
              <p className="text-[11px] leading-relaxed">
                If running Ollama as a systemd service, configure the service settings:
              </p>
            </div>

            <div className="bg-black/40 border border-[var(--surface-border)] rounded-xl p-3.5 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-wider">Launch Service Edit Mode</span>
                <button
                  onClick={() => handleCopy('sudo systemctl edit ollama.service', 'Systemctl Command')}
                  className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-all"
                >
                  {copiedText === 'sudo systemctl edit ollama.service' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  Copy command
                </button>
              </div>
              <div className="text-amber-400">sudo systemctl edit ollama.service</div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">2</span>
              <p className="text-[11px] leading-relaxed">
                This opens a systemd override editor. Add these exact configuration lines below the top comment block:
              </p>
            </div>

            <div className="bg-black/40 border border-[var(--surface-border)] rounded-xl p-3.5 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-wider">Service definition override</span>
                <button
                  onClick={() => handleCopy('[Service]\nEnvironment="OLLAMA_ORIGINS=*"\n', 'Override config')}
                  className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-all"
                >
                  {copiedText === '[Service]\nEnvironment="OLLAMA_ORIGINS=*"\n' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  Copy configuration block
                </button>
              </div>
              <div className="text-left text-green-400 whitespace-pre-line leading-relaxed">
                [Service]
                Environment="OLLAMA_ORIGINS=*"
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400 mt-0.5 shrink-0">3</span>
              <p className="text-[11px] leading-relaxed">
                Save and exit the editor (usually Ctrl+O, Enter, Ctrl+X if in nano), then reload the system service and restart the server:
              </p>
            </div>

            <div className="bg-black/40 border border-[var(--surface-border)] rounded-xl p-3.5 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[9px] uppercase font-bold tracking-wider">Commands to apply overrides</span>
                <button
                  onClick={() => handleCopy('sudo systemctl daemon-reload && sudo systemctl restart ollama', 'Reload Command')}
                  className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-[var(--accent)] transition-all"
                >
                  {copiedText === 'sudo systemctl daemon-reload && sudo systemctl restart ollama' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  Copy command block
                </button>
              </div>
              <div className="text-blue-400">sudo systemctl daemon-reload && sudo systemctl restart ollama</div>
            </div>
          </div>
        )}
      </div>

      <hr className="border-[var(--surface-border)] my-4" />

      {/* Alternative Options */}
      <div className="pt-2 text-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-neutral-500 shrink-0" />
          <span className="text-[11px] text-neutral-400 font-medium leading-normal">
            Using a non-standard port or hostname? You can customize the API endpoint address.
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          className="px-4 py-2 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-[var(--surface-border)] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 active:scale-95 text-center"
        >
          Adjust API Settings
        </button>
      </div>
    </div>
  );
};
