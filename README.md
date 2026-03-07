# NexChat

NexChat is a production-ready Web AI Chat application built with React 19, Vite, and Tailwind CSS v4. It runs entirely on the frontend, persisting state locally without relying on any self-hosted backends, directly connecting to OpenAI-compatible APIs.

## Key Features

- **Local First & Privacy**: No data leaves your browser except what goes to the standard AI endpoint you provide.
- **Pure Front-End**: Easily deploy anywhere (Vercel, Netlify, Github Pages).
- **Smooth Streaming**: Handcrafted SSE parser and robust React queuing system for rapid typography-like streaming with optimal performance.
- **Robust State Management**: Built tightly with Zustand, including deep migration, persisted quotas, throttling, and session caching.
- **Rich Experience**:
  - Context-aware Markdown and code highlighting.
  - "New chat" vs. historic sessions.
  - Auto-scroll lock mechanisms and error partial-recoveries.
  - Adaptive layout built for mobile PWA usage (`100dvh`, Drawer modes).

## Quick Start

```bash
# Install dependencies
npm install

# Start local server
npm run dev

# Build for production
npm run build
```

## Setup Configuration
Upon first load, NexChat will ask for an API Key, Base URL, and Model. Ensure that your Base URL connects to an OpenAI compatible endpoint (e.g. `https://api.openai.com/v1`).

## System Architecture

- `src/domain`: Business models and Zustand Stores (`configStore`, `chatStore`, `uiStore`). Handles multi-session logic.
- `src/core`: Heavy-lifting networking (`streamChat`, `sseParser`, `classifyError`) and Throttled Storage logic.
- `src/components`: UI Views utilizing Ant Design and Tailwind CSS.
