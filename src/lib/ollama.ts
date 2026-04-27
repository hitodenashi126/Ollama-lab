import { Message, Settings, OllamaModel } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'http://localhost:11434',
  systemPrompt: 'You are a helpful, creative, and clever AI assistant.',
  temperature: 0.7,
  topP: 0.9,
  numCtx: 4096,
  theme: 'glass-dark',
};

export async function listModels(baseUrl: string): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

export async function chatStream(
  baseUrl: string,
  model: string,
  messages: Message[],
  settings: Settings,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: settings.systemPrompt },
        ...messages.map(({ role, content }) => ({ role, content }))
      ],
      options: {
        temperature: settings.temperature,
        top_p: settings.topP,
        num_ctx: settings.numCtx,
      },
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to connect to Ollama');
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
