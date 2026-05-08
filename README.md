# The Daily Brief

An AI-powered financial news aggregator that fetches headlines from multiple sources, deduplicates and ranks them using a large language model, then generates a structured market intelligence article with editorial formatting, hero images, and actionable stock picks.

The pipeline runs on demand or on a schedule. Articles are stored as JSON and served through a React reader app with light and dark modes. An Admin Studio provides a pipeline runner, article manager, CMS editor, and chat interface.

![Architecture](img/architecture.png)

---

## ✦ Features

- Fetches headlines from NewsAPI, Finnhub, and Alpha Vantage in parallel
- LLM deduplication and significance ranking via Minimax MiniMax-M2.7
- Generates structured articles: executive summary, market breakdown, opportunities with tickers, risks, macro outlook
- Market Breakdown sections use `###` sub-headings for scannable editorial layout
- Hero images sourced automatically from Pexels API with per-category Unsplash fallback
- Article CRUD via REST API with pre-computed excerpts for feed performance
- React reader with editorial typography (Playfair Display + Lora), category badges, and dark mode
- Admin Studio with real-time pipeline logs over WebSocket
- CMS editor for manual article creation and editing
- Streaming AI chat panel powered by Minimax

---

## 📁 Directory Structure

```
financial-news/
├── pipeline/
│   ├── index.js        # Orchestrator — fetch → rank → write → save
│   ├── fetcher.js      # NewsAPI, Finnhub, Alpha Vantage clients
│   ├── llm.js          # Minimax calls (aggregate + write column)
│   ├── formatter.js    # Markdown → CMS block array
│   ├── images.js       # Pexels / Unsplash hero image fetcher
│   └── config.js       # Environment config
├── backend/
│   ├── server.js
│   └── routes/
│       ├── articles.js # CRUD for articles + excerpt computation
│       ├── pipeline.js # Trigger pipeline via HTTP
│       ├── chat.js     # Minimax chat proxy
│       └── assets.js   # Image upload
├── frontend/
│   └── src/
│       ├── reader/     # Public feed (NewsFeed, ArticleView, ReaderLayout)
│       └── admin/      # Admin Studio (pipeline runner, CMS editor)
├── content/
│   ├── articles/       # Published articles as JSON
│   └── published/      # Exported markdown files
├── docker-compose.yml
├── Dockerfile
└── .env
```

---

## 🚀 Quick Start

**Prerequisites:** Node 18+, Ollama, Docker

**1. Clone and install dependencies**

```bash
git clone https://github.com/justthatpixel/the-daily-brief.git
cd the-daily-brief
npm install
cd frontend && npm install && cd ..
```

**2. Configure environment variables**

```bash
cp .env.example .env
# Fill in your API keys — see Environment Variables below
```

**3. Start the backend**

```bash
node backend/server.js
```

**4. Start the frontend dev server**

```bash
cd frontend && npm run dev
```

**5. Run the pipeline to generate your first article**

```bash
node pipeline/index.js
```

Or trigger it from the browser once the servers are running.

- Admin Studio: `http://localhost:5175/admin`
- Reader App: `http://localhost:5175/reader`

---

## ⚙ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEWSAPI_KEY` | Yes | Headlines from [newsapi.org](https://newsapi.org) |
| `FINNHUB_KEY` | Yes | Market data from [finnhub.io](https://finnhub.io) |
| `ALPHA_VANTAGE_KEY` | No | Additional market headlines |
| `MINIMAX_API_KEY` | Yes | LLM for aggregation and article writing |
| `PEXELS_API_KEY` | No | Hero images — falls back to Unsplash if absent |

---

## 📸 Screenshots

### Reader App
<img width="1316" height="1035" alt="Screenshot 2026-05-08 at 12 01 13" src="https://github.com/user-attachments/assets/b34625b9-eb54-4b8a-b62a-fd23d6ad3f37" />

## Article View
<img width="1330" height="1062" alt="Screenshot 2026-05-08 at 12 01 32" src="https://github.com/user-attachments/assets/154a6c07-301c-4dc6-aad2-8b17ecad45b2" />

### Admin Studio
![Admin Studio](img/admin.png)<img width="1327" height="1067" alt="Screenshot 2026-05-08 at 12 11 16" src="https://github.com/user-attachments/assets/61ff6545-23b2-4f30-a8b0-5168370b85f3" />


### Pipeline Logs
![Pipeline Logs](img/pipeline.png)<img width="1694" height="1068" alt="Screenshot 2026-05-08 at 12 12 20" src="https://github.com/user-attachments/assets/949d7b2c-0dc3-4abb-ba82-16d8329f41aa" />

### Editor
<img width="1682" height="1073" alt="Screenshot 2026-05-08 at 12 13 25" src="https://github.com/user-attachments/assets/8f4c5c92-d9fc-41d0-9f67-aa35f4ec556f" />

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/articles` | List all articles (includes pre-computed excerpt, excludes blocks) |
| `GET` | `/api/articles/:id` | Get single article with full block content |
| `POST` | `/api/articles` | Create a new article |
| `PUT` | `/api/articles/:id` | Update an existing article |
| `DELETE` | `/api/articles/:id` | Delete an article |
| `POST` | `/api/articles/:id/publish` | Export article to markdown file |
| `POST` | `/api/pipeline/run` | Trigger the news pipeline |
| `GET` | `/api/pipeline/status` | Get current pipeline status |
| `POST` | `/api/chat` | Streaming chat with Minimax |
| `POST` | `/api/assets/upload` | Upload an image asset |
| `GET` | `/assets/:filename` | Serve an uploaded image |
