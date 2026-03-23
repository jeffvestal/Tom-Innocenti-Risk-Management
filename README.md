# Jina AI + Elastic Inference Service — Enablement Kit

Build a legal compliance search tool for the EU AI Act using **Jina AI models** on **Elastic Inference Service (EIS)**.

This kit was built for Elastic field engineers but works for anyone who wants to learn how semantic search, reranking, and managed inference endpoints work together in Elasticsearch.

## What's Inside

| Component | Location | What It Does |
|-----------|----------|-------------|
| **Presentation** | `docs/presentation/` | 90-minute enablement session slides (HTML) |
| **Notebooks** | `notebooks/` | Hands-on Python notebooks — build the pipeline step by step |
| **Interactive App** | `ui/` | Next.js demo with Search, Agent Chat, and Data Lab modes |
| **Walkthrough** | `docs/app-walkthrough.md` | Guided script for the hands-on portion |

## The Scenario

A fictional law firm, **"Innocenti & Associates"**, needs to search the EU AI Act with legal precision. Standard keyword search fails on regulatory nuance — we fix that with:

1. **Jina Reader** — Converts the EU AI Act from EUR-Lex HTML to clean markdown
2. **Jina Embeddings v5** — Multilingual semantic embeddings (pre-configured on Elastic Cloud)
3. **Jina Reranker v3** — Listwise reranking for precision results
4. **Elasticsearch `semantic_text`** — Zero-config vector search (auto-embeds at ingest)

---

## Prerequisites

- Elastic Cloud account (Serverless or Hosted) with API key
- Jina API key — free at [jina.ai](https://jina.ai/api-dashboard/)
- Python 3.10+ (for notebooks)
- Node.js 18+ (for the app)

---

## Quick Start: Notebooks

Two notebooks, run in order:

| Notebook | What You'll Build |
|----------|------------------|
| `01_full_chain.ipynb` | Full pipeline: PDF ingestion → article parsing → semantic indexing → search → reranking |
| `02_eis_platform.ipynb` | Explore EIS: list endpoints, compare embedding models, stream LLM chat |

```bash
pip install -r requirements.txt
```

Open in Jupyter or [Google Colab](https://colab.research.google.com/github/jeffvestal/Tom-Innocenti-Risk-Management/blob/main/notebooks/01_full_chain.ipynb).

Each notebook prompts for credentials (Elasticsearch URL, API key, Jina API key) on first run.

---

## Quick Start: Interactive App

```bash
cd ui
npm install
cp .env.local.example .env.local   # fill in your credentials
npm run setup                       # loads EU AI Act data
npm run dev                         # opens at localhost:3000
```

Three modes:

- **Search** — Semantic search with before/after reranking comparison
- **Agent** — RAG-powered compliance advisor (uses Kibana Agent Builder)
- **Data Lab** — Watch the ingestion pipeline run in real time

See [`docs/app-walkthrough.md`](docs/app-walkthrough.md) for a guided tour with suggested queries.

---

## Credentials

Copy `ui/.env.local.example` to `ui/.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `ELASTICSEARCH_URL` | Yes | Elasticsearch endpoint URL |
| `ELASTIC_API_KEY` | Yes | API key with index/search permissions |
| `JINA_API_KEY` | Yes | Jina AI API key |
| `AGENT_CONNECTOR_ID` | For Agent mode | Kibana LLM connector ID (default: `OpenAI-GPT-4-1-Mini`) |

---

## Running Tests

```bash
make test-all          # Everything: notebook + UI tests
make test-nb-all       # Notebook unit + smoke tests
cd ui && npm test      # UI unit tests (Vitest)
cd ui && npm run test:e2e   # E2E browser tests (Playwright)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Search | Elasticsearch with `semantic_text` + Elastic Inference Service |
| Embeddings | Jina Embeddings v5 (pre-configured on EIS) |
| Reranking | Jina Reranker v3 (listwise attention) |
| Ingestion | Jina Reader (`r.jina.ai`) |
| App | Next.js 14, Tailwind CSS |
| Agent | Kibana Agent Builder with ES|QL tool |

## License

MIT
