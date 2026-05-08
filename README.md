# 📰 The Daily Financial Column v2.0

An AI-powered financial news aggregator with a full web application. Fetch the latest headlines from multiple sources, use local LLM (Qwen3.5:9b via Ollama) to aggregate and synthesize the stories, and output a beautifully formatted newspaper-style column.

## ✨ Features

- **Multi-source news fetching** from NewsAPI, Finnhub, and Alpha Vantage
- **Local LLM processing** with Qwen3.5:9b via Ollama (no cloud dependency for pipeline)
- **Admin Studio** — Pipeline runner, Article manager, CMS editor, Chat interface
- **Reader App** — Finimize-style news reader with dark mode
- **Real-time pipeline logs** via WebSocket
- **Streaming AI chat** with Minimax M2

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Ensure Ollama is Running

```bash
# Install Ollama
brew install ollama

# Pull the model
ollama pull qwen3.5:9b

# Start Ollama (runs in background)
ollama serve
```

### 3. Configure API Keys

Edit the `.env` file with your API keys. Keys needed:
- `NEWSAPI_KEY` — Free at https://newsapi.org
- `FINNHUB_KEY` — Free at https://finnhub.io  
- `MINIMAX_API_KEY` — For chat panel (https://api.minimax.io)

### 4. Run the Application

```bash
# Start the backend server
cd backend && node server.js

# In another terminal, run the frontend dev server (optional, for hot reload)
cd frontend && npm run dev
```

Then open:
- **Admin Studio**: http://localhost:3000/admin
- **Reader App**: http://localhost:3000/reader

## 🐳 Docker Deployment

```bash
docker-compose up --build -d
```

Access on your LAN at `http://<your-mac-ip>:3000`

## 📁 Project Structure

```
financial-news/
├── docker-compose.yml    # Docker orchestration
├── Dockerfile             # Container definition
├── .env                   # API keys (gitignored)
│
├── backend/               # Express API server
│   ├── server.js          # Main entry + WebSocket
│   ├── websocket.js       # WebSocket handler
│   └── routes/
│       ├── pipeline.js    # Pipeline runner API
│       ├── articles.js    # CMS articles CRUD
│       ├── chat.js        # Minimax proxy
│       └── assets.js      # Image upload
│
├── pipeline/              # News aggregation scripts
│   ├── index.js          # Main orchestrator
│   ├── fetcher.js        # News API fetching
│   ├── llm.js            # Ollama + Minimax clients
│   └── formatter.js      # Output formatting
│
├── frontend/             # React + Vite + Tailwind
│   ├── src/
│   │   ├── admin/        # Admin Studio components
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── PipelinePanel.jsx
│   │   │   ├── ArticleManager.jsx
│   │   │   ├── CMSEditor.jsx
│   │   │   └── ChatPanel.jsx
│   │   └── reader/       # Reader App components
│   │       ├── ReaderLayout.jsx
│   │       ├── NewsFeed.jsx
│   │       └── ArticleView.jsx
│   └── dist/             # Pre-built static assets
│
└── content/              # Article storage
    ├── articles/         # JSON article files
    ├── published/        # Exported .md files
    └── assets/           # Uploaded images
```

## 🤖 AI Models

| Task | Model | Location |
|------|-------|----------|
| News aggregation | qwen3.5:9b | Ollama (local) |
| Column writing | qwen3.5:9b | Ollama (local) |
| Admin chat | MiniMax-M2 | Minimax API |

## 🔌 API Endpoints

### Pipeline
- `POST /api/pipeline/run` — Start pipeline
- `GET /api/pipeline/status` — Get status

### Articles
- `GET /api/articles` — List all
- `GET /api/articles/:id` — Get one
- `POST /api/articles` — Create
- `PUT /api/articles/:id` — Update
- `DELETE /api/articles/:id` — Delete
- `POST /api/articles/:id/publish` — Export to .md

### Chat
- `POST /api/chat` — Streaming chat with Minimax

### Assets
- `POST /api/assets/upload` — Upload image
- `GET /assets/:filename` — Serve image

---

*Built with Claude Code and Qwen3.5:9b*