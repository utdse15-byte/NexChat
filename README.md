# NexChat

NexChat is a full-stack AI Chat application featuring **RAG knowledge base** and **multi-Agent orchestration**. The frontend is built with React 19 + Vite + TailwindCSS, and the backend is powered by Python FastAPI + LangChain + ChromaDB.

## Key Features

- **Dual Mode**: Pure frontend (direct API) or full-stack backend mode with enhanced AI capabilities.
- **RAG Knowledge Base**: Upload documents (TXT/MD/PDF) → vector indexing → semantic retrieval → context-augmented generation.
- **Multi-Agent Architecture**: Router Agent automatically dispatches to Chat / RAG / Summary agents based on user intent.
- **Streaming Chat**: SSE-based real-time streaming with retry, timeout handling, and abort support.
- **Local First & Privacy**: Chat history is primarily stored locally in the browser's IndexedDB. In backend mode, messages are also synced to the server database (SQLite) for audit and future extension purposes.
- **Docker Ready**: One-command deployment with `docker-compose up`.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, Zustand, Ant Design |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| AI/RAG | LangChain, ChromaDB, OpenAI API |
| DevOps | Docker, Docker Compose, Nginx |

## Cloud Deployment

NexChat is designed to deploy to a **frontend-on-Vercel + backend-on-Render** combo:

- **Frontend**: Static SPA on Vercel CDN (zero-config)
- **Backend**: FastAPI in a Docker container on Render
- **Cross-origin** wired via build-time `VITE_DEFAULT_BACKEND_URL` and CORS allowlist

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the step-by-step guide (Render Blueprint, Vercel project setup, env vars, troubleshooting).

## Quick Start (Local)

### Frontend Only (Original Mode)

```bash
npm install
npm run dev
```

### Full-Stack Mode (Frontend + Backend)

```bash
# 1. Setup backend
cd server
cp .env.example .env    # Edit .env with your API key
pip install -r requirements.txt
python main.py          # Starts on http://localhost:8000

# 2. Start frontend (in project root)
npm run dev             # Vite proxies /api to backend
```

### Docker Compose

```bash
cp server/.env.example server/.env  # Edit with your API key
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

## Architecture

```
src/                          # React Frontend
├── components/               #   UI Components (Chat, Settings, Knowledge, Sidebar)
├── core/                     #   Transport (SSE), Providers (OpenAI/Backend), Context
├── domain/                   #   Zustand Stores (Chat, Config, UI)
└── hooks/                    #   useChatStream, useAutoScroll

server/                       # Python Backend (FastAPI)
├── agents/                   #   Router, Chat, RAG, Summary Agents
├── rag/                      #   Document Loader, Text Splitter, Vector Store, Retriever
├── database/                 #   SQLAlchemy Models + SQLite
├── routers/                  #   API Routes (Chat, Knowledge, Sessions)
└── services/                 #   Business Logic Layer
```
