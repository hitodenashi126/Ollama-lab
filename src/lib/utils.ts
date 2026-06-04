import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatSession } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export function calculateSessionTokens(session: ChatSession | undefined, systemPrompt: string = ''): TokenUsage {
  if (!session || !session.messages || session.messages.length === 0) {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  let promptChars = systemPrompt.length;
  let completionChars = 0;

  session.messages.forEach(msg => {
    let msgLength = msg.content ? msg.content.length : 0;
    
    if (msg.role === 'user' && msg.attachments) {
      msg.attachments.forEach(att => {
        msgLength += (att.name || '').length + (att.content || '').length;
      });
    }

    if (msg.role === 'assistant') {
      completionChars += msgLength;
    } else {
      promptChars += msgLength;
    }
  });

  // 1 token is approx 4 characters in Llama / standard tokenizers.
  // Using 3.8 accounts for whitespace/special characters better.
  // Chat template tokens adds around ~8 tokens per message for markers like <|im_start|> user <|im_end|>.
  const userMsgCount = session.messages.filter(m => m.role !== 'assistant').length;
  const assistantMsgCount = session.messages.filter(m => m.role === 'assistant').length;

  const promptTokens = Math.max(0, Math.ceil(promptChars / 3.8)) + (userMsgCount * 8);
  const completionTokens = Math.max(0, Math.ceil(completionChars / 3.8)) + (assistantMsgCount * 8);

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens
  };
}

