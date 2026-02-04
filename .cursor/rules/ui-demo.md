# Innocenti Risk Management - UI Demo App

## Project Context

This is Layer B of the "Innocenti Risk Management" enablement kit. Layer A (Python notebooks) is already complete and has:
- Indexed the EU AI Act into Elasticsearch using `semantic_text` with `jina-embeddings-v3`
- Set up a reranker inference endpoint using `jina-reranker-v3`

The UI connects to the **same Elastic index** created by the notebooks.

## What to Build

A polished Next.js demo app for customer presentations (C-Level/VP audience).

### Stack
- Next.js 14+ (App Router)
- Tailwind CSS
- Lucide React icons
- Elasticsearch JS client

### Visual Identity
- **Theme:** "High-End Legal / Risk Dashboard"
- **Color Palette:** Dark mode, Slate Grey background, Gold accents
- **Typography:** Clean, professional (Inter or similar)
- **Tone:** Enterprise-grade, sophisticated

### Core Features

1. **Search Bar**
   - Global search across EU AI Act articles
   - Clean, prominent design

2. **Results Display**
   - Show article number, title, relevance score
   - Expandable text preview

3. **"Deep Analysis" Button**
   - Triggers reranking via `text_similarity_reranker` retriever
   - Results should visually shuffle/reorder with animation
   - Show before/after ranking comparison

4. **Language Toggle** (UI only for now)
   - Placeholder for [EN] [DE] toggle
   - Prep for multilingual demo even if data is EN only

### Technical Notes

- Use Elastic's `retrievers` API for reranking (same pattern as notebook 03)
- Index name pattern: `search-eu-ai-act-{user_suffix}` (but can hardcode for demo)
- Inference endpoints: `jina-embeddings-v3-{suffix}`, `jina-reranker-v3-{suffix}`
- Credentials via environment variables: `ELASTIC_CLOUD_ID`, `ELASTIC_API_KEY`

### Reference Files
- `Master Plan.txt` - Full project specification
- `notebooks/03_rerank.ipynb` - Reranking implementation pattern
- `notebooks/utils/credentials.py` - Naming conventions

## Directory Structure (Suggested)

```
ui/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── search/
│           └── route.ts
├── components/
│   ├── SearchBar.tsx
│   ├── ResultCard.tsx
│   └── DeepAnalysisButton.tsx
├── lib/
│   └── elasticsearch.ts
├── package.json
├── tailwind.config.ts
└── .env.local.example
```
