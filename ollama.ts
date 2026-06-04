#!/usr/bin/env npx tsx
/**
 * Ollama Command-Line Utility (ollama.ts)
 * Highly polished standalone TypeScript CLI for interacting with Ollama.
 * 
 * Features:
 *  - Colors and formatting via ANSI escapes (Zero external dependencies!)
 *  - Full streaming responses for chat and single-prompt generation
 *  - Interactive chat session loop with prompt persistence history
 *  - Beautiful in-place downloading progress bar for pulling new models
 *  - Detailed system status diagnostics and model metadata inspect screens
 * 
 * Compiling this to a single-file JS bundle is incredibly simple:
 *   npx esbuild ollama.ts --bundle --platform=node --target=node18 --outfile=ollama.js
 * Or run directly:
 *   npx tsx ollama.ts
 */

import * as readline from 'readline';
import { EventEmitter } from 'events';

// --- ANSI Escape Code Helpers for Beautiful Styling ---
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

const clr = (text: string | number, colorCode: string) => `${colorCode}${text}${c.reset}`;
const logSection = (title: string) => console.log(`\n${clr(`─── ${title} ───`, c.bold + c.cyan)}`);

// Define Ollama default URL and override if env specified
const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Helper to check sizes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Help menu print
function printHelp() {
  console.log(`
${clr('🦙 Ollama Studio CLI Helper', c.bold + c.brightYellow)}
${clr('Version 1.0.0 (TypeScript Standalone)', c.dim + c.italic)}

${clr('Usage:', c.bold + c.cyan)}
  ${clr('npx tsx ollama.ts <command> [arguments]', c.green)}

${clr('Commands:', c.bold + c.cyan)}
  ${clr('ls, list', c.bold + c.green)}             List all local models installed in the local Ollama instance
  ${clr('run <model> [prompt]', c.bold + c.green)} Run a model. Launches interactive chat if prompt is omitted.
                           If prompt is passed, outputs streaming answer and exits.
  ${clr('pull <model>', c.bold + c.green)}         Seamlessly fetch and cache neural model weights from Ollama registry
                           Shows interactive real-time progress bar.
  ${clr('show <model>', c.bold + c.green)}         Display comprehensive configuration, metadata, and template for model
  ${clr('status', c.bold + c.green)}               Test connection, uptime and verify current system responsiveness
  ${clr('help', c.bold + c.green)}                 Display this menu

${clr('Environment Config:', c.bold + c.cyan)}
  ${clr('OLLAMA_HOST', c.brightBlue)}         Set custom Ollama server connection (Default: ${clr(HOST, c.dim)})

${clr('Examples:', c.bold + c.cyan)}
  ${clr('$ npx tsx ollama.ts ls', c.gray)}
  ${clr('$ npx tsx ollama.ts run llama3.2 "Why is the sky blue?"', c.gray)}
  ${clr('$ npx tsx ollama.ts run deepseek-r1:8b', c.gray)}
  ${clr('$ npx tsx ollama.ts pull qwen2.5-coder:7b', c.gray)}
`);
}

// Commands execution functions
async function handleStatus() {
  logSection('Ollamalab CLI Engine Diagnostics');
  console.log(`${clr('Connection Target Host:', c.bold)} ${clr(HOST, c.brightBlue)}`);
  
  try {
    const start = Date.now();
    const res = await fetch(`${HOST}/`);
    const duration = Date.now() - start;
    
    if (res.ok) {
      const text = await res.text();
      console.log(`${clr('Service Status:', c.bold)}     ${clr('ONLINE 🟢', c.bold + c.brightGreen)}`);
      console.log(`${clr('System Handshake:', c.bold)}   ${clr(text.trim() || 'Ollama is running', c.dim)}`);
      console.log(`${clr('Response Latency:', c.bold)}   ${clr(`${duration}ms`, c.bold + c.brightCyan)}`);
      console.log(`\n${clr('✓ Local connection successfully verified. Ready to communicate with models!', c.green)}`);
    } else {
      console.log(`${clr('Service Status:', c.bold)}     ${clr('UNHEALTHY 🟡', c.bold + c.brightYellow)}`);
      console.log(`Ollama responded with status code: ${res.status}`);
    }
  } catch (err: any) {
    console.log(`${clr('Service Status:', c.bold)}     ${clr('OFFLINE 🔴', c.bold + c.brightRed)}`);
    console.log(`\n${clr('🚨 Connection Refused!', c.bold + c.red)}`);
    console.log(clr(`Unable to reach the Ollama service on ${HOST}.`, c.white));
    console.log(`Please make sure your local Ollama app is currently running. You can launch it by running:`);
    console.log(`  ${clr('ollama serve', c.yellow)}`);
    console.log(`Or visit ${clr('https://ollama.com/', c.brightCyan)} to download and set up your local compiler.`);
    process.exit(1);
  }
}

async function handleList() {
  try {
    const res = await fetch(`${HOST}/api/tags`);
    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
    
    const data = await res.json() as { models?: any[] };
    const models = data.models || [];
    
    logSection(`Installed Local Models (${models.length})`);
    
    if (models.length === 0) {
      console.log(clr('No models found active. Let\'s pull one! E.g. "npx tsx ollama.ts pull llama3.2"', c.brightYellow));
      return;
    }
    
    // Build table padding widths
    let maxNameLen = 'NAME'.length;
    let maxSizeLen = 'SIZE'.length;
    let maxFamilyLen = 'FAMILY'.length;
    let maxQuantLen = 'QUANTIZATION'.length;
    
    const formattedModels = models.map(m => {
      const name = m.name || 'unknown';
      const sizeStr = formatBytes(m.size || 0);
      const family = m.details?.family || 'unknown';
      const quant = m.details?.quantization_level || 'unknown';
      const modifiedStr = m.modified_at ? new Date(m.modified_at).toLocaleDateString() : 'unknown';
      
      maxNameLen = Math.max(maxNameLen, name.length);
      maxSizeLen = Math.max(maxSizeLen, sizeStr.length);
      maxFamilyLen = Math.max(maxFamilyLen, family.length);
      maxQuantLen = Math.max(maxQuantLen, quant.length);
      
      return { name, sizeStr, family, quant, modifiedStr };
    });
    
    // Draw Header
    const header = 
      clr('NAME'.padEnd(maxNameLen + 3), c.bold + c.magenta) +
      clr('FAMILY'.padEnd(maxFamilyLen + 3), c.bold + c.cyan) +
      clr('SIZE'.padEnd(maxSizeLen + 3), c.bold + c.green) +
      clr('QUANTIZATION'.padEnd(maxQuantLen + 3), c.bold + c.yellow) +
      clr('MODIFIED', c.bold + c.dim);
    console.log(header);
    console.log('─'.repeat(maxNameLen + maxFamilyLen + maxSizeLen + maxQuantLen + 20));
    
    // Draw Rows
    for (const m of formattedModels) {
      console.log(
        clr(m.name.padEnd(maxNameLen + 3), c.bold + c.brightWhite) +
        clr(m.family.padEnd(maxFamilyLen + 3), c.brightCyan) +
        clr(m.sizeStr.padEnd(maxSizeLen + 3), c.brightGreen) +
        clr(m.quant.padEnd(maxQuantLen + 3), c.brightYellow) +
        clr(m.modifiedStr, c.dim)
      );
    }
    console.log();
  } catch (err: any) {
    console.error(clr(`\nError, could not retrieve local model registry. Is Ollama running?`, c.red));
    console.error(clr(err.message, c.dim));
  }
}

async function handleShow(modelName: string) {
  if (!modelName) {
    console.log(clr('Error: You must provide a valid model name to display details. Usage: npx tsx ollama.ts show <model>', c.red));
    process.exit(1);
  }
  
  try {
    const res = await fetch(`${HOST}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName })
    });
    
    if (res.status === 404) {
      console.log(clr(`Error: Model "${modelName}" not found in local registries. Run 'ls' to see installed models or pull it.`, c.red));
      return;
    }
    
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    
    const data = await res.json() as any;
    
    logSection(`Model Spec: ${modelName}`);
    if (data.details) {
      console.log(`${clr('Backend Format:', c.bold)}      ${clr(data.details.format || 'unknown', c.magenta)}`);
      console.log(`${clr('Model Family:', c.bold)}        ${clr(data.details.family || 'unknown', c.cyan)}`);
      console.log(`${clr('Parameter Count:', c.bold)}     ${clr(data.details.parameter_size || 'unknown', c.green)}`);
      console.log(`${clr('Quantization Level:', c.bold)}  ${clr(data.details.quantization_level || 'unknown', c.yellow)}`);
    }
    
    if (data.parameters) {
      logSection('Default Hyperparameters');
      console.log(clr(data.parameters, c.yellow));
    }
    
    if (data.system) {
      logSection('In-Memory System Instructions Prompt');
      console.log(clr(data.system, c.brightBlue));
    }
    
    if (data.template) {
      logSection('Tokenizer/Instruction Formatting Template');
      console.log(clr(data.template, c.dim));
    }
  } catch (err: any) {
    console.error(clr(`\nError: Could not retrieve info for model "${modelName}"`, c.red));
    console.error(clr(err.message, c.dim));
  }
}

async function handlePull(modelName: string) {
  if (!modelName) {
    console.log(clr('Error: Specify a model name to pull. Usage: npx tsx ollama.ts pull <model>', c.red));
    process.exit(1);
  }
  
  logSection(`Downloading Model weights: ${modelName}`);
  console.log(`Connecting to Ollama Registry server from ${HOST}...`);
  
  try {
    const response = await fetch(`${HOST}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true })
    });
    
    if (!response.ok) {
      throw new Error(`Pull failed with HTTP Code ${response.status}`);
    }
    
    if (!response.body) {
      throw new Error('Null response body. Streaming not supported by runtime context.');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let lastCompletedPart = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkStr = decoder.decode(value, { stream: true });
      // Incoming streaming updates can contain multiple JSON elements separated by newlines
      const lines = chunkStr.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const update = JSON.parse(line);
          
          if (update.error) {
            console.log(`\n${clr('Error pulling model:', c.red)} ${update.error}`);
            return;
          }
          
          if (update.status) {
            const status = update.status;
            const completed = update.completed || 0;
            const total = update.total || 0;
            
            if (total > 0) {
              const pct = Math.floor((completed / total) * 100);
              const barWidth = 35;
              const filledLen = Math.floor((pct / 100) * barWidth);
              const bar = '█'.repeat(filledLen) + '░'.repeat(barWidth - filledLen);
              
              const progressLine = `\r ${clr('[', c.dim)}${clr(bar, c.brightGreen)}${clr(']', c.dim)} ${clr(`${pct}%`, c.bold + c.brightYellow)} (${formatBytes(completed)}/${formatBytes(total)}) - ${clr(status, c.dim)}  `;
              process.stdout.write(progressLine);
            } else {
              // General non-percentage status info
              if (lastCompletedPart !== status) {
                process.stdout.write(`\n * ${clr(status, c.bold + c.brightBlue)}...`);
                lastCompletedPart = status;
              }
            }
          }
        } catch {
          // Chunk splitting boundary anomalies, secure pass
        }
      }
    }
    
    console.log(`\n\n🎉 ${clr('Success! Model compilation complete.', c.bold + c.brightGreen)}`);
    console.log(`You can now run: ${clr(`npx tsx ollama.ts run ${modelName}`, c.bold + c.yellow)}`);
    console.log();
  } catch (err: any) {
    console.error(clr(`\n\n🚨 Pull aborted due to execution error:`, c.bold + c.red));
    console.error(clr(err.message, c.dim));
  }
}

async function handleRun(modelName: string, prompt?: string) {
  if (!modelName) {
    console.log(clr('Error: Specify a model target. Usage: npx tsx ollama.ts run <model_name> [prompt]', c.red));
    process.exit(1);
  }
  
  if (prompt) {
    // Single prompt execution model
    await sendPrompt(modelName, prompt);
  } else {
    // Dynamic interactive Chat loop mode
    await startInteractiveChat(modelName);
  }
}

// Stream single generation
async function sendPrompt(modelName: string, prompt: string): Promise<boolean> {
  process.stdout.write(`${clr('Prompt:', c.bold + c.dim)} ${prompt}\n`);
  process.stdout.write(`${clr('Thinking:', c.bold + c.cyan)} `);
  
  try {
    const res = await fetch(`${HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: true
      })
    });
    
    if (res.status === 404) {
      console.log(clr(`\nError: Model "${modelName}" not found. Try pulling it first: npx tsx ollama.ts pull ${modelName}`, c.red));
      return false;
    }
    
    if (!res.ok) throw new Error(`HTTP Status Code ${res.status}`);
    if (!res.body) throw new Error('Response stream of body content is blank');
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let hasReturnedStream = false;
    let inThinkBlock = false;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const chunkJson = JSON.parse(line);
          const responseChunk = chunkJson.response || '';
          
          if (responseChunk) {
            if (!hasReturnedStream) {
              // First actual token printed
              process.stdout.write(`\r${clr('Response:', c.bold + c.brightYellow)} `);
              hasReturnedStream = true;
            }
            
            // Handle beautiful rendering for <think> tag if outputting reasoning model (like deepseek-r1)
            let finalOutput = responseChunk;
            if (responseChunk.includes('<think>')) {
              inThinkBlock = true;
              finalOutput = responseChunk.replace('<think>', `\n[${clr('Reasoning Mode ON', c.dim + c.italic)}]\n${c.dim}`);
            }
            if (responseChunk.includes('</think>')) {
              inThinkBlock = false;
              finalOutput = responseChunk.replace('</think>', `${c.reset}\n\n`);
            }
            
            if (inThinkBlock && !responseChunk.includes('<think>')) {
              // dim text during reasoning compilation
              process.stdout.write(`${c.dim}${finalOutput}${c.reset}`);
            } else {
              process.stdout.write(finalOutput);
            }
          }
        } catch {
          // Boundary stream JSON parsing safety hook
        }
      }
    }
    console.log('\n');
    return true;
  } catch (err: any) {
    console.log(clr(`\n\nGeneration task aborted: ${err.message}`, c.red));
    return false;
  }
}

// Full interactive terminal conversation state tracking
async function startInteractiveChat(modelName: string) {
  // Check if model exists first
  try {
    const listRes = await fetch(`${HOST}/api/tags`);
    if (listRes.ok) {
      const listData = await listRes.json() as { models?: any[] };
      const exists = (listData.models || []).some(m => m.name === modelName || m.name.split(':')[0] === modelName);
      if (!exists && listData.models && listData.models.length > 0) {
        console.log(clr(`⚠️  Warning: Model "${modelName}" is not verified in installed local tags checklist.`, c.yellow));
        console.log(`We will attempt streaming connections anyway. Make sure it is pulled!`);
      }
    }
  } catch {
    // Continue silently
  }

  logSection(`Interactive Session: ${modelName}`);
  console.log(`Welcome to the terminal playground chat console!`);
  console.log(`Instructions: Type your prompts freely. System retains sequence history.`);
  console.log(`Special scripts supported:`);
  console.log(`  ${clr('/reset', c.bold + c.yellow)}  Flushes current chat history arrays`);
  console.log(`  ${clr('/bye', c.bold + c.yellow)}    Terminates conversation session and exits`);
  console.log();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${clr('You', c.bold + c.brightGreen)} ${clr('❯', c.brightBlue)} `
  });
  
  let chatHistory: Array<{ role: 'user' | 'assistant', content: string }> = [];
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (!input) {
      rl.prompt();
      return;
    }
    
    if (input === '/bye') {
      console.log(`\n${clr('Goodbye! Live session closed.', c.dim + c.italic)}\n`);
      rl.close();
      return;
    }
    
    if (input === '/reset') {
      chatHistory = [];
      console.log(`\n🧹 ${clr('Session state flushed. History stack is fully cleared!', c.bold + c.brightCyan)}\n`);
      rl.prompt();
      return;
    }
    
    // Add user message to state array
    chatHistory.push({ role: 'user', content: input });
    
    // Setup clean terminal loading characters
    process.stdout.write(`${clr('AI Reader connects...', c.dim)} `);
    
    try {
      const start = Date.now();
      const res = await fetch(`${HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: chatHistory,
          stream: true
        })
      });
      
      if (!res.ok) {
        throw new Error(`Ollama Chat request failed: status ${res.status}`);
      }
      
      if (!res.body) {
        throw new Error('Null streaming body received from chat port');
      }
      
      // Clear loading feedback line
      process.stdout.write(`\r${clr('Ollama', c.bold + c.magenta)} ${clr('❯', c.brightYellow)} `);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let fullAssistantReply = '';
      let activeThinkBlock = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const payload = JSON.parse(line);
            const contentPart = payload.message?.content || '';
            
            if (contentPart) {
              fullAssistantReply += contentPart;
              
              let finalChunk = contentPart;
              if (contentPart.includes('<think>')) {
                activeThinkBlock = true;
                finalChunk = contentPart.replace('<think>', `\n[${clr('Thinking Process', c.dim + c.italic)}]\n${c.dim}`);
              }
              if (contentPart.includes('</think>')) {
                activeThinkBlock = false;
                finalChunk = contentPart.replace('</think>', `${c.reset}\n\n`);
              }
              
              if (activeThinkBlock && !contentPart.includes('<think>')) {
                process.stdout.write(`${c.dim}${finalChunk}${c.reset}`);
              } else {
                process.stdout.write(finalChunk);
              }
            }
          } catch {
            // Json boundaries
          }
        }
      }
      
      // Add Assistant reply back into retention session array
      chatHistory.push({ role: 'assistant', content: fullAssistantReply });
      console.log('\n');
      
    } catch (err: any) {
      console.log(`\n${clr('Error on conversation step:', c.red)} ${err.message}`);
    }
    
    rl.prompt();
  });
}

// --- Main CLI Execution Controller Router ---
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }
  
  const cmd = args[0].toLowerCase();
  
  switch (cmd) {
    case 'help':
    case '-h':
    case '--help':
      printHelp();
      break;
      
    case 'ls':
    case 'list':
      await handleList();
      break;
      
    case 'status':
      await handleStatus();
      break;
      
    case 'show':
      await handleShow(args[1]);
      break;
      
    case 'pull':
      await handlePull(args[1]);
      break;
      
    case 'run':
      // Prompt could be multi-argument or single argument
      const model = args[1];
      const prompt = args.slice(2).join(' ').trim();
      await handleRun(model, prompt || undefined);
      break;
      
    default:
      console.log(clr(`Unknown commands: "${args[0]}"`, c.red));
      printHelp();
      process.exit(1);
  }
}

main().catch(err => {
  console.error(clr('Error executing main thread:', c.red));
  console.error(err);
  process.exit(1);
});
