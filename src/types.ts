export interface FileAttachment {
  name: string;
  content: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
}

export interface Settings {
  baseUrl: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  numCtx: number;
  theme: 'glass-dark' | 'glass-light' | 'solid-dark' | 'solid-light';
  chatStyle: 'boxed' | 'unboxed';
  accentColor: string;
  showTimestamp: boolean;
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}
