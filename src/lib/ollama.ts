import { Message, Settings, OllamaModel } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'http://localhost:11434',
  systemPrompt: 'You are a helpful, creative, and clever AI assistant.',
  temperature: 0.7,
  topP: 0.9,
  numCtx: 4096,
  theme: 'glass-dark',
  chatStyle: 'boxed',
  accentColor: '#3b82f6',
  showTimestamp: true,
};

export class OllamaError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OllamaError';
  }
}

export async function listModels(baseUrl: string): Promise<OllamaModel[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal }).catch(err => {
      if (err.name === 'AbortError') throw new OllamaError(`Connection timed out. Checking Ollama status...`);
      throw new OllamaError(`Cannot reach Ollama at ${baseUrl}. Ensure Ollama is running.`);
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new OllamaError('Ollama API endpoint not found. Please check your Base URL.');
      }
      throw new OllamaError(`Ollama returned an error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    if (error instanceof OllamaError) throw error;
    throw new OllamaError('Failed to fetch models. Check your network connection.');
  }
}

export async function chatStream(
  baseUrl: string,
  model: string,
  messages: Message[],
  settings: Settings,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const mappedMessages = messages.map(({ role, content, attachments }) => {
    let finalContent = content;
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        finalContent += `\n\n--- File: ${file.name} ---\n${file.content}\n--- End of File ---\n`;
      });
    }
    return { role, content: finalContent };
  });

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: settings.systemPrompt },
        ...mappedMessages
      ],
      options: {
        temperature: settings.temperature,
        top_p: settings.topP,
        num_ctx: settings.numCtx,
      },
      stream: true,
    }),
    signal,
  }).catch(err => {
    if (err.name === 'AbortError') throw err;
    throw new OllamaError(`Connection failed. Make sure Ollama is running at ${baseUrl}`);
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Ollama error (${response.status})`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    if (response.status === 404) {
      throw new OllamaError(`Model "${model}" not found. You might need to pull it first.`);
    }

    throw new OllamaError(errorMessage, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          onChunk(json.message.content);
        }
        if (json.done) return;
      } catch (e) {
        console.warn('Failed to parse chunk', e);
      }
    }
  }
}

export async function pullModel(baseUrl: string, name: string, onProgress?: (status: string, percentage?: number) => void): Promise<void> {
  const response = await fetch(`${baseUrl}/api/pull`, {
    method: 'POST',
    body: JSON.stringify({ name, stream: true }),
  });

  if (!response.ok) throw new Error('Failed to pull model');

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (onProgress) {
          const percentage = json.total ? Math.round((json.completed / json.total) * 100) : undefined;
          onProgress(json.status, percentage);
        }
        if (json.status === 'success') return;
      } catch (e) {
        console.warn('Failed to parse pull progress', e);
      }
    }
  }
}

export async function deleteModel(baseUrl: string, name: string): Promise<void> {
  const response = await fetch(`${baseUrl}/api/delete`, {
    method: 'DELETE',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) throw new Error('Failed to delete model');
}
