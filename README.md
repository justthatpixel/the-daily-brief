# The Daily Brief

An automated financial news aggregator that fetches headlines, deduplicates and ranks them with an LLM, then generates a structured market intelligence article — complete with hero images and stock picks for retail investors.

---

## Screenshots

### News feed — featured article and sidebar
<img alt="News feed" src="https://github.com/user-attachments/assets/b9535d85-93c2-4d64-9a28-2871561726b6" />

### Article view — light mode
<img alt="Article view light mode" src="https://github.com/user-attachments/assets/4e81da22-b747-4c26-9180-a41907db13b5" />

### Article view — dark mode
<img alt="Article view dark mode" src="https://github.com/user-attachments/assets/f2fdf2a7-2730-44db-8c1d-a6538e12d4c5" />

### Article body — What's Happening and Market Breakdown
<img alt="What's Happening and Market Breakdown" src="https://github.com/user-attachments/assets/31bd878d-73f8-4436-a431-4ae2921b3c9b" />

### Article body — Market Breakdown sub-headings
<img alt="Market Breakdown sub-headings" src="https://github.com/user-attachments/assets/12343eee-c5ea-4a3e-9f42-b7da9f6abab1" />

### Article body — Opportunities, Risks and The Bigger Picture
<img alt="Opportunities and Risks" src="https://github.com/user-attachments/assets/3d192d7b-efe6-4c06-82c3-baa2aa194bee" />

### Admin Studio — Articles list
<img alt="Admin articles list" src="https://github.com/user-attachments/assets/7ed293b4-64d8-4bf9-8c3f-1c73e1c1462b" />

### Admin Studio — CMS Editor
<img alt="Admin CMS editor" src="https://github.com/user-attachments/assets/342a70f0-ac6d-4f31-98ff-3ab6a551c25a" />

### Admin Studio — Pipeline runner
<img alt="Admin pipeline runner" src="docs/screenshots/admin.png" />

---

## How It Works

1. **Fetch** — pulls headlines from NewsAPI, Finnhub, and Alpha Vantage
2. **Aggregate** — Minimax LLM deduplicates and ranks stories by significance
3. **Write** — LLM generates a full article: executive summary, market breakdown (with `###` sub-headings), opportunities with tickers, risks, and macro outlook
4. **Publish** — article saved as JSON to the CMS; hero image fetched from Pexels (Unsplash static fallback per category)

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Playfair Display + Lora fonts |
| Backend | Express.js (port 3000) |
| Pipeline | Node.js CLI (`node pipeline/index.js`) |
| LLM | Minimax `MiniMax-M2.7` (OpenAI-compatible API) |
| Images | Pexels API (Unsplash static fallback) |
| News sources | NewsAPI, Finnhub, Alpha Vantage |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
cd frontend && npm install
```

### 2. Configure environment

Create a `.env` file at the project root:

```
NEWSAPI_KEY=
FINNHUB_KEY=
ALPHA_VANTAGE_KEY=
MINIMAX_API_KEY=
PEXELS_API_KEY=
```

### 3. Run

```bash
# Terminal 1 — backend
node backend/server.js

# Terminal 2 — frontend dev server
cd frontend && npm run dev
```

Open `http://localhost:5175/reader`.

### 4. Generate an article

```bash
node pipeline/index.js
```

Or use the Admin Studio at `http://localhost:5175/admin`.

---

## Project Structure

```
pipeline/
  index.js        # Orchestrator — fetch → rank → write → save
  fetcher.js      # NewsAPI, Finnhub, Alpha Vantage clients
  llm.js          # Minimax calls (aggregate + write column)
  formatter.js    # Markdown → CMS block array
  images.js       # Pexels / Unsplash hero image fetcher
  config.js       # Environment config

backend/
  server.js
  routes/
    articles.js   # CRUD for articles + excerpt computation
    pipeline.js   # Trigger pipeline via HTTP
    chat.js       # Minimax chat proxy
    assets.js     # Image upload

frontend/
  src/
    reader/       # Public feed (NewsFeed, ArticleView, ReaderLayout)
    admin/        # Admin Studio (pipeline runner, CMS editor)

content/
  articles/       # Published articles as JSON
  published/      # Exported markdown files
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/articles` | List articles (includes pre-computed excerpt) |
| `GET` | `/api/articles/:id` | Full article with blocks |
| `POST` | `/api/articles` | Create article |
| `PUT` | `/api/articles/:id` | Update article |
| `DELETE` | `/api/articles/:id` | Delete article |
| `POST` | `/api/pipeline/run` | Trigger pipeline |
| `POST` | `/api/chat` | Streaming chat (Minimax) |
