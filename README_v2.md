# The Daily Brief

> AI-powered financial news aggregator — fetch, synthesise, and publish a daily market briefing in one command.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-local%20LLM-black?logo=ollama)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

The Daily Brief pulls headlines from NewsAPI, Finnhub, and Alpha Vantage, deduplicates and ranks them with a local LLM (Qwen3.5:9b via Ollama), then writes a structured market briefing with stock opportunities and risk callouts. Articles are stored as JSON and served through a React reader with an editorial FT/Bloomberg aesthetic. Built for retail investors and finance enthusiasts who want a local, private, self-hosted news feed.

---

## 📸 Screenshots

![The Daily Brief - Reader App](docs/screenshots/reader.png)
![Admin Studio](docs/screenshots/admin.png)

---

## ✨ Features

<table>
<tr>
<td valign="top" width="50%">

**🗞 Multi-source fetching**
Pulls headlines from NewsAPI, Finnhub, and Alpha Vantage simultaneously.

**🤖 Local LLM pipeline**
Qwen3.5:9b via Ollama deduplicates, ranks, and writes the brief — no cloud required.

**📊 Structured articles**
Every article includes a Market Breakdown with sub-headings, Opportunities (tickers), and Risks.

**🖼 Auto hero images**
Pexels API provides category-matched hero images; curated Unsplash fallback if unavailable.

</td>
<td valign="top" width="50%">

**🎛 Admin Studio**
Pipeline runner with real-time logs, article manager, TipTap CMS editor, and AI chat panel.

**📖 Reader App**
Editorial reader with dark mode, category filtering, 1200px layout, and Playfair Display typography.

**💬 Streaming chat**
Minimax M2 powers the admin chat panel with streaming responses.

**🐳 Docker-ready**
Single `docker-compose up` for LAN deployment — no Node install needed on the host.

</td>
</tr>
</table>

---

## 🏗 Architecture

```
financial-news/
├── pipeline/                  # News fetching + LLM synthesis
│   ├── index.js               #   Orchestrator — runs all four steps
│   ├── fetcher.js             #   Parallel fetch from NewsAPI / Finnhub / AlphaVantage
│   ├── llm.js                 #   Ollama (aggregation) + Minimax (column writing) clients
│   ├── formatter.js           #   Markdown → CMS block converter
│   ├── images.js              #   Pexels hero image fetcher with Unsplash fallback
│   └── config.js              #   Centralised env/config loader
│
├── backend/                   # Express API + WebSocket server (port 3000)
│   ├── server.js              #   Entry point, static serving, WS upgrade
│   └── routes/
│       ├── articles.js        #   CRUD for JSON article files
│       ├── pipeline.js        #   Trigger pipeline run, stream logs via WS
│       ├── chat.js            #   Minimax streaming chat proxy
│       └── assets.js          #   Multer image upload → /assets/:filename
│
├── frontend/                  # React + Vite + Tailwind (proxied to :3000 in dev)
│   └── src/
│       ├── admin/             #   Admin Studio — pipeline, editor, article list, chat
│       └── reader/            #   Public reader — feed, article view, layout
│
├── content/                   # Runtime data (gitignored except seed articles)
│   ├── articles/              #   Published article JSON files
│   ├── published/             #   Exported Markdown files
│   └── assets/                #   User-uploaded images
│
├── docker-compose.yml         # Compose file — app + Ollama services
├── Dockerfile                 # Multi-stage Node build
└── .env                       # API keys — copy from .env.example
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Ollama** — [ollama.ai](https://ollama.ai) with `qwen3.5:9b` pulled
- **Docker** *(optional)* — only needed for containerised deployment

---

### 1 — Clone and install

```bash
git clone https://github.com/your-username/financial-news.git
cd financial-news
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys (see [Environment Variables](#-environment-variables) below).

### 3 — Start Ollama and pull the model

```bash
brew install ollama      # macOS — see ollama.ai for Linux/Windows
ollama pull qwen3.5:9b
ollama serve             # runs on localhost:11434
```

### 4 — Start the backend

```bash
cd backend
node server.js
# Admin Studio → http://localhost:3000/admin
# Reader App   → http://localhost:3000/reader
```

### 5 — Start the frontend dev server *(optional — for hot reload)*

```bash
cd frontend
npm run dev
# Vite dev server → http://localhost:5173 (proxies /api to :3000)
```

### 6 — Run the pipeline

Open **Admin Studio → Pipeline** and click **Run Pipeline**, or run headlessly:

```bash
node pipeline/index.js
# Add --silent to suppress terminal output
```

---

### Docker (LAN deployment)

```bash
docker-compose up --build -d
```

Access from any device on your network at `http://<host-ip>:3000`.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEWSAPI_KEY` | ✅ | Headlines from [newsapi.org](https://newsapi.org) — free tier available |
| `FINNHUB_KEY` | ✅ | Market data from [finnhub.io](https://finnhub.io) — free tier available |
| `ALPHA_VANTAGE_KEY` | ✅ | Financial data from [alphavantage.co](https://www.alphavantage.co) — free tier available |
| `MINIMAX_API_KEY` | ✅ | Column writing + chat via [api.minimax.io](https://api.minimax.io) |
| `MINIMAX_MODEL` | — | Model ID, defaults to `MiniMax-M2.7` |
| `MINIMAX_BASE_URL` | — | API base, defaults to `https://api.minimax.io` |
| `PEXELS_API_KEY` | — | Hero images from [pexels.com/api](https://www.pexels.com/api/) — falls back to Unsplash if unset |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pipeline/run` | Trigger a full pipeline run |
| `GET` | `/api/pipeline/status` | Get current pipeline status |
| `GET` | `/api/articles` | List all articles (with excerpts, no full blocks) |
| `GET` | `/api/articles/:id` | Fetch a single article with full block content |
| `POST` | `/api/articles` | Create a new article |
| `PUT` | `/api/articles/:id` | Update article — also syncs `heroImage` from first image block |
| `DELETE` | `/api/articles/:id` | Delete an article |
| `POST` | `/api/articles/:id/publish` | Export article to Markdown in `content/published/` |
| `POST` | `/api/chat` | Streaming chat completion via Minimax |
| `POST` | `/api/assets/upload` | Upload image (JPG/PNG/WebP/GIF/SVG, max 5 MB) |
| `GET` | `/assets/:filename` | Serve an uploaded asset |

---

## 🧰 Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | React 18 + Vite 5 | SPA, HMR in dev |
| Styling | Tailwind CSS | Custom editorial palette, dark mode |
| Rich text editor | TipTap | Block-based CMS editor in Admin Studio |
| Backend | Express.js | REST API + WebSocket log streaming |
| LLM — aggregation | Qwen3.5:9b via Ollama | Runs fully local, no API key needed |
| LLM — writing + chat | Minimax M2 (MiniMax-M2.7) | Cloud API, OpenAI-compatible |
| News sources | NewsAPI, Finnhub, Alpha Vantage | Free tiers sufficient for daily use |
| Hero images | Pexels API | Category-matched; Unsplash static fallback |
| File uploads | Multer | Local disk storage in `content/assets/` |
| Containerisation | Docker + Compose | Includes Ollama sidecar service |

---

## 🗺 Roadmap

- [ ] Email digest — send the daily brief via SMTP on a cron schedule
- [ ] Category filtering — per-category feeds in the reader
- [ ] Multiple LLM backends — swap Ollama model via Admin settings UI
- [ ] Mobile app — React Native reader with push notifications
- [ ] Search — full-text search across the article archive

---

## 📄 License

MIT

---

<sub>Built with [Claude Code](https://claude.ai/code) · Powered by Qwen3.5:9b and Minimax M2</sub>
