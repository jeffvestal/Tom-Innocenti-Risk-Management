# Innocenti Risk Management - Enablement Kit

## What This Is

Field engineering **enablement kit** for Elastic: "Full Chain" search pipeline using **Jina AI models** on **Elastic Inference Service (EIS)**. Scenario: fictional law firm "Innocenti & Associates" searches the EU AI Act.

**Audience:** Internal Elastic field engineers and SAs presenting to C-Level/VP audiences.

## Two-Part Structure

| Part | Location | Language | Purpose |
|------|----------|----------|---------|
| Data Pipeline | `notebooks/` | Python / Jupyter | Ingest PDF, index, demonstrate reranking |
| Interactive Demo | `ui/` | Next.js 14 (TypeScript) | Search + Agent + Data Lab UI |
| Presentation | `docs/presentation/` | HTML + Python PPTX exporters | 90-min enablement session slides |

Both notebooks and UI operate on the same index: `search-eu-ai-act-demo`.

## Environment

Credentials in `ui/.env.local` (copy from `ui/.env.local.example`). Both UI and notebooks read from this file.

| Variable | Required | Description |
|----------|----------|-------------|
| `ELASTICSEARCH_URL` | Yes* | ES endpoint URL (Serverless standard) |
| `ELASTIC_CLOUD_ID` | Alt* | Classic Cloud deployment ID |
| `ELASTIC_API_KEY` | Yes | API key with index/search/manage permissions |
| `JINA_API_KEY` | Yes | Jina AI API key |
| `AGENT_CONNECTOR_ID` | For Agent | Kibana LLM connector ID |

Kibana URL auto-derived from `ELASTICSEARCH_URL` by swapping `.es.` → `.kb.`. Override with explicit `KIBANA_URL` if needed.

## Naming Conventions

| Resource | ID / Name |
|----------|-----------|
| Elasticsearch index | `search-eu-ai-act-demo` |
| Embedding inference endpoint | `.jina-embeddings-v5-text-small` (built-in on Serverless) |
| Reranker inference endpoint | `jina-reranker-v3-demo` |
| Agent Builder agent | `eu-ai-act-compliance-agent` |
| Agent Builder tool | `eu-ai-act-search` (type: `esql`) |

## Key Commands

```bash
# UI
cd ui && npm install && npm run dev     # Start dev server
npm run setup                           # Create index + load data
npm run setup:agent                     # Provision agent + esql tool

# Testing
make test-all                           # Everything: notebook + UI tests
make test-nb-all                        # Notebook unit + smoke (49 tests)
make test-ui-unit                       # Vitest unit tests (123 tests)
make test-ui-e2e                        # Playwright E2E tests (25 tests)

# Presentation PPTX export
cd docs/presentation && python3 export_pptx.py
```

## Architectural Gotchas

1. **Jina VLM beta URL** — Must use `api-beta-vlm.jina.ai`, NOT `api.jina.ai`.
2. **Embedding endpoint is built-in on Serverless** — `.jina-embeddings-v5-text-small` is pre-configured. Do NOT call `inference.put()` for it. Only the reranker needs explicit creation.
3. **Agent Builder `_getType` bug** — `index_search` tool + certain connectors triggers runtime error. We use `esql` tool type instead.
4. **Agent PUT excludes `id`** — When updating via `PUT /api/agent_builder/agents/{id}`, the `id` must NOT be in the request body.
5. **SSE double-envelope** — Kibana Agent Builder wraps payload: `data: {"data": {...actual...}}`. Parse outer JSON, then access `.data`.
6. **Jina API key in EIS** — Must be in `service_settings.api_key`, not `secret_settings`.
7. **VLM cold start** — ~45s after idle. Route retries 3x with 15s/30s delays.

## Three UI Modes

### 1. Text Search (default)
- `POST /api/search` → `semantic` query on `text` field via `semantic_text` mapping
- "Deep Analysis" triggers reranking via `text_similarity_reranker` retriever
- Bilingual: EN/DE toggle filters by `language` field

### 2. Agent Chat
- `POST /api/agent` → SSE proxy to Kibana `converse/async` endpoint
- Agent uses `eu-ai-act-search` tool (esql) with `MATCH` on `semantic_text`
- Image uploads: VLM analysis → injected as context into agent message
- Follow-up pills via `/api/agent/followups` using `unified_completion`

### 3. Data Lab
- Interactive pipeline visualization (fetch → parse → inference → index)
- `POST /api/ingest` → SSE progress stream

## VLM Pipeline

```
Image upload → POST /api/vision → Jina VLM (api-beta-vlm.jina.ai)
  → 4-dimension extraction: data types, outputs, subjects, human review
  → Analysis injected into agent message as [Architecture Analysis from VLM] context
```

## Agent Connector Selection

| Connector | Speed | Accuracy | Notes |
|-----------|-------|----------|-------|
| OpenAI GPT-4.1 Mini | ~25s | Correct | **Default**: fastest accurate model |
| Claude 4.6 Opus | ~90s | Thorough | Best for demos where depth matters |
| Claude 4.5 Sonnet | ~45s | Good | Mid-tier option |
| Gemini 2.5 Flash | ~30s | Shallow | Fast but misses high-risk items |
| Gemini 2.5 Pro | Timeout | N/A | Avoid — consistently times out |

## Testing

| Suite | Location | Count | What it covers |
|-------|----------|-------|----------------|
| Notebook unit | `notebooks/tests/test_*.py` | 46 | Credentials, parsing, inference utils |
| Notebook smoke | `notebooks/tests/test_notebooks_smoke.py` | 3 | Full notebook execution with mocked services |
| Notebook integration | `notebooks/tests/test_notebooks_integration.py` | 4 | Real services (opt-in: `make test-nb-integration`) |
| UI unit | `ui/__tests__/unit/` | 123 | Components, API routes, lib functions |
| UI E2E | `ui/__tests__/e2e/` | 25 | Search, agent, language toggle, modals |

## Presentation

Two versions: **themed** ("We Might Be Illegal in Europe" narrative) and **standard** (plain technical walkthrough). Both share the same content and interactive demos.

- Themed: `docs/presentation/index.html` (29 sections, fully polished)
- Standard: `docs/presentation/index-standard.html` (17 sections, needs parity updates)
- 6 generated diagram images in `docs/presentation/assets/`
- PPTX exporters: `export_pptx.py` (themed), `export_pptx_standard.py` (standard)

## Maintaining This File

Update when changing: project structure, env vars, test infrastructure, naming conventions, architectural patterns, commands, or discovering new gotchas. Keep concise and factual.
