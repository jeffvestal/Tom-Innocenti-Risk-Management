# Innocenti Risk Management - UI Demo

A polished demo application for searching the EU AI Act with semantic search and AI-powered reranking.

## Features

- **Semantic Search**: Search the EU AI Act using natural language queries powered by Jina Embeddings v3
- **Deep Analysis**: One-click reranking using Jina Reranker v3's listwise attention mechanism
- **Visual Diagram Auditor**: Upload an architecture diagram and let Jina VLM analyze the data flow, then automatically search for EU AI Act compliance risks
- **Visual Comparison**: See how results change with reranking (movement indicators, before/after ranks)
- **Professional UI**: Dark theme with gold accents, optimized for executive demos

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with:
- `ELASTIC_CLOUD_ID` - Your Elastic Cloud deployment ID
- `ELASTIC_API_KEY` - API key with read/write access to indices
- `JINA_API_KEY` - Get your free key at [jina.ai/api-dashboard](https://jina.ai/api-dashboard/)

### 3. Run Setup (First Time Only)

This creates the search index and loads the EU AI Act data:

```bash
npm run setup
```

The setup script will:
1. Check if the index already exists (safe to run multiple times)
2. Fetch the EU AI Act PDF via Jina Reader API
3. Parse it into article chunks
4. Create Jina inference endpoints for embeddings and reranking
5. Index all articles with automatic embedding generation

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Text Search
1. **Search**: Enter a query like "biometric identification" or "law enforcement facial recognition"
2. **View Results**: See the top 10 semantically similar articles
3. **Deep Analysis**: Click the gold "Deep Analysis" button to trigger reranking
4. **Compare**: Results will reorder with movement indicators showing ranking changes

### Visual Diagram Auditor
1. **Upload**: Click the image icon next to the search bar and select an architecture diagram
2. **Audit**: The Jina VLM analyzes the diagram and produces a detailed data-flow summary
3. **Review**: Read the VLM Audit Report in the collapsible panel above results
4. **Compliance Search**: The analysis is automatically used as a search query to surface relevant EU AI Act articles
5. **Deep Analysis**: Optionally click "Deep Analysis" to rerank the results

> **Note:** The Jina VLM has a ~45-second cold start after idle periods. The first upload may take up to a minute. If it fails, wait 30 seconds and try again.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Components (Search, Results, Comparison View)     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Server                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/search  - Proxies to Elasticsearch                 │   │
│  │  /api/vision  - Calls Jina VLM for diagram analysis     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Elastic Cloud                               │
│  ┌──────────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ search-eu-ai-act │  │ Jina Embed   │  │ Jina Reranker   │   │
│  │ (semantic_text)  │  │ v3 (EIS)     │  │ v3 (EIS)        │   │
│  └──────────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Search Modes

### Naive Semantic Search
```typescript
query: { semantic: { field: "text", query: "your query" } }
```

### Reranked Search (retrievers API)
```typescript
retriever: {
  text_similarity_reranker: {
    retriever: { standard: { query: { semantic: { field: "text", query } } } },
    field: "text",
    inference_id: "jina-reranker-v3-demo",
    inference_text: query,
    rank_window_size: 50
  }
}
```

## Sample Queries

Try these to see the power of reranking:

- `"Can law enforcement use facial recognition?"` - Reranking surfaces specific exceptions
- `"biometric identification systems"` - Compare general vs specific matches
- `"AI system risk categories"` - See how articles are reordered by relevance

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Styling with dark theme
- **Lucide React** - Icons
- **Elasticsearch** - Search backend with semantic_text
- **Jina AI** - Embeddings (v3), Reranking (v3), and Vision Language Model (VLM)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Create index and load data (idempotent) |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

## Troubleshooting

### "Search index not found"
Run `npm run setup` to create the index and load data.

### "Elasticsearch not configured"
Ensure `.env.local` exists with valid `ELASTIC_CLOUD_ID` and `ELASTIC_API_KEY`.

### "Jina Reader empty response"
The PDF fetch sometimes needs retries. The setup script handles this automatically, but you may need to run it again if it fails.

### Vision Diagram Auditor times out or returns an error
The Jina VLM has a cold start of ~45 seconds after idle periods. The API route retries automatically (up to 3 attempts). If it still fails, wait about 30 seconds and upload again. Ensure `JINA_API_KEY` is set in `.env.local`.

---

Part of the **Innocenti Risk Management** enablement kit for demonstrating Jina AI + Elasticsearch integration.
