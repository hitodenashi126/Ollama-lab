<div align="center">
  <h1>🧪 Ollama Lab</h1>
  <p><strong>A modern, high-performance web interface for interacting with local Ollama AI models in your browser</strong></p>
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat-square)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg?style=flat-square)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38b2ac.svg?style=flat-square)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
</div>

---

## ✨ Overview

**Ollama Lab** is a beautiful, feature-rich chat interface that brings your local Ollama AI models to the browser. Featuring real-time streaming responses, multi-session conversations, file attachments, and a stunning glassmorphic UI with multiple theme options.

Perfect for developers, researchers, and AI enthusiasts who want a powerful yet intuitive way to interact with local language models.

---

## 🎯 Key Features

### 💬 **Chat Interface**
- Real-time streaming responses with token-by-token display
- Multi-session conversation management with persistent history
- Auto-scroll to latest messages
- Typing indicators and connection status monitoring

### 📎 **File Attachments**
- **Images**: JPEG, PNG, WebP (up to 5MB)
- **Text Files**: .txt, .js, .ts, .tsx, .py, .html, .css, .json, .md
- Attach multiple files per message
- Visual preview of attached files

### 🎨 **Beautiful UI**
- **4 Theme Options**:
  - 🌙 Glass Dark (Default)
  - ☀️ Glass Light
  - 🖤 Solid Dark (AMOLED-optimized)
  - ⚪ Solid Light
- Responsive design (mobile & desktop)
- Glassmorphic design with mesh gradients
- Smooth animations and transitions

### 📝 **Rich Content Rendering**
- Full **Markdown** support
- **Syntax highlighting** for code blocks with 25+ languages
- Copy-to-clipboard for code snippets
- Save responses as markdown files
- Image rendering and display

### ⚙️ **Configurable Settings**
- Custom Ollama server URL (default: `http://localhost:11434`)
- System prompt customization
- Temperature adjustment (0.0 - 1.0)
- Top-P sampling control (0.0 - 1.0)
- Context window size configuration (numCtx)
- Theme selection

### 💾 **Persistent State**
- All conversations saved to browser localStorage
- Settings auto-saved
- Automatic session recovery
- Selected model persists across sessions

### 🔌 **Local-First**
- Works with local Ollama instances
- No cloud API dependencies required
- Complete privacy and data control
- Optional Android app support via Capacitor

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ installed
- **Ollama** running locally on `http://localhost:11434`
- At least one Ollama model installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hitodenashi126/Ollama-lab.git
   cd Ollama-lab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

4. **Open in your browser**
   Navigate to http://localhost:3000 and start chatting!

### Production Build

```bash
npm run build
npm run preview
```

---

## 📋 How It Works

### Architecture Overview

```
┌─────────────────────────────────────────┐
│           Browser (React App)            │
│  ┌──────────────────────────────────┐   │
│  │   UI Components                  │   │
│  │  ├─ Sidebar (Sessions)           │   │
│  │  ├─ MessageList (Display)        │   │
│  │  ├─ ChatInput (User Input)       │   │
│  │  └─ SettingsModal (Config)       │   │
│  └──────────────────────────────────┘   │
│              ↓                            │
│  ┌──────────────────────────────────┐   │
│  │   State Management (App.tsx)     │   │
│  │  ├─ Sessions                     │   │
│  │  ├─ Messages                     │   │
│  │  ├─ Settings                     │   │
│  │  └─ Connection Status            │   │
│  └──────────────────────────────────┘   │
│              ↓                            │
│  ┌──────────────────────────────────┐   │
│  │   API Layer (lib/ollama.ts)      │   │
│  │  ├─ listModels()                 │   │
│  │  └─ chatStream()                 │   │
│  └──────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   ↓
          ┌──────────────────┐
          │  Local Ollama    │
          │  Instance        │
          │ :11434           │
          └──────────────────┘
```

### Data Flow

1. **User sends message** → ChatInput captures text + files
2. **Files processed** → Images converted to base64, text files embedded
3. **API call** → POST to `/api/chat` with streaming enabled
4. **Stream processing** → Response chunks received line-by-line
5. **Real-time update** → UI updates with each token received
6. **Display** → Markdown rendered with syntax highlighting
7. **Persistence** → Session saved to localStorage

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool & dev server
- **Tailwind CSS 4.1** - Styling
- **Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### Content Rendering
- **react-markdown** - Markdown parsing and rendering
- **react-syntax-highlighter** - Code syntax highlighting
- **Prism.js** - Language-specific highlighting

### Mobile Support
- **Capacitor 8** - Cross-platform mobile framework
- **Android support** - Native Android app compilation

### Utilities
- **uuid** - Session ID generation
- **clsx & tailwind-merge** - Class name utilities
- **date-fns** - Date formatting

---

## 📁 Project Structure

```
Ollama-lab/
├── src/
│   ├── App.tsx                 # Main app component & state management
│   ├── main.tsx                # React entry point
│   ├── types.ts                # TypeScript type definitions
│   ├── index.css               # Global styles & themes
│   ├── components/
│   │   ├── Sidebar.tsx         # Session & model management
│   │   ├── MessageList.tsx     # Chat display with markdown
│   │   ├── ChatInput.tsx       # User input with file upload
│   │   └── SettingsModal.tsx   # Settings panel
│   └── lib/
│       ├── ollama.ts           # Ollama API integration
│       └── utils.ts            # Utility functions
├── public/                     # Static assets
├── android/                    # Android app configuration
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## ⚙️ Configuration

### Ollama Server URL
The default Ollama server URL is `http://localhost:11434`. You can change this in the Settings panel in the app, or set it before loading:

```typescript
// Default settings in src/lib/ollama.ts
export const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'http://localhost:11434',
  systemPrompt: 'You are a helpful, creative, and clever AI assistant.',
  temperature: 0.7,
  topP: 0.9,
  numCtx: 4096,
  theme: 'glass-dark',
};
```

### Environment Variables
Create a `.env.local` file for environment-specific settings:

```env
# Optional: Set default values
VITE_OLLAMA_URL=http://localhost:11434
```

---

## 🎮 Usage

### Starting a Conversation
1. Select a model from the dropdown (if not already selected)
2. Type your message in the chat input
3. Attach files (optional) using the paperclip icon
4. Click Send or press Shift+Enter to submit

### Managing Sessions
- **New Chat** - Click "New" button in sidebar to start a new conversation
- **Switch Session** - Click any session in the sidebar
- **Rename Session** - Right-click on session title
- **Delete Session** - Click delete icon on session

### Customizing Settings
1. Click the ⚙️ gear icon
2. Adjust parameters as needed:
   - System prompt
   - Temperature (creativity level)
   - Top-P (diversity)
   - Context window size
   - Theme preference
3. Changes auto-save

### Copying Content
- **Copy code blocks** - Hover over code and click the copy button
- **Copy entire response** - Click the copy button in message header
- **Save as file** - Click the download button to save as markdown

---

## 📱 Mobile Support

The app is fully responsive and works great on mobile devices. For native Android app:

```bash
# Sync to Android project
npm run cap:sync

# Open in Android Studio
npm run cap:open:android

# Build APK
# (Use Android Studio or gradle commands)
```

---

## 🔌 API Reference

### Ollama API Endpoints Used

#### Get Available Models
```
GET /api/tags
```
Returns list of installed models with metadata.

#### Chat with Streaming
```
POST /api/chat
Content-Type: application/json

{
  "model": "llama2",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "...", "images": ["base64..."] }
  ],
  "options": {
    "temperature": 0.7,
    "top_p": 0.9,
    "num_ctx": 4096
  },
  "stream": true
}
```

---

## 🎨 Theming

The app supports 4 built-in themes. Customize by editing `src/index.css`:

```css
/* Glass Dark (Default) */
.glass-dark {
  --bg-dark: #05070a;
  --accent: #3b82f6;
  /* ... more variables ... */
}

/* Glass Light */
.glass-light {
  --bg-dark: #f8fafc;
  --accent: #2563eb;
  /* ... more variables ... */
}

/* Solid Dark (AMOLED) */
.solid-dark {
  --bg-dark: #000000;
  --accent: #ffffff;
  /* ... more variables ... */
}

/* Solid Light */
.solid-light {
  --bg-dark: #ffffff;
  --accent: #000000;
  /* ... more variables ... */
}
```

---

## 🚨 Troubleshooting

### "Ollama Offline - Retrying..."
- Ensure Ollama is running: `ollama serve`
- Check that Ollama URL is correct in Settings
- Verify no firewall is blocking `localhost:11434`

### Models not appearing
- Make sure you have models installed: `ollama list`
- Pull a model: `ollama pull llama2` (or your preferred model)
- Restart Ollama if just installed

### Responses not streaming
- Check browser console for errors (F12)
- Ensure the model can run on your hardware
- Try a smaller model if out of memory

### File attachments not working
- Check file size (max 5MB)
- Verify file type is supported
- Clear browser cache and reload

---

## 📊 Browser Support

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) - Local AI inference
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Motion](https://motion.dev/) - Animations
- [Lucide Icons](https://lucide.dev/) - Icon set

---

## 📞 Support

For issues, feature requests, or questions:
- 📋 [Open an Issue](https://github.com/hitodenashi126/Ollama-lab/issues)
- 💬 [Discussions](https://github.com/hitodenashi126/Ollama-lab/discussions)
- 🐦 Contact via GitHub

---

## 🎯 Roadmap

- [ ] Export/Import chat sessions
- [ ] Model-specific configurations
- [ ] Voice input support
- [ ] Dark mode toggle improvements
- [ ] Plugin system for extensions
- [ ] Docker deployment configuration
- [ ] Cloud sync options (optional)
- [ ] Advanced prompt templates

---

<div align="center">
  <p><strong>Made with ❤️ by hitodenashi126</strong></p>
  <p>Star ⭐ if you find this project useful!</p>
</div>
