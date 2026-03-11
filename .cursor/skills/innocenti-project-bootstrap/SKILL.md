---
name: innocenti-project-bootstrap
description: Project context and bootstrapping knowledge for the Innocenti Risk Management enablement kit. Covers environment setup, three UI modes (Search, Agent, Data Lab), agent configuration, VLM pipeline, connector selection, key architectural decisions, and testing. Use when starting a new session on this project, onboarding, or needing project-specific context.
---

# Innocenti Risk Management - Project Bootstrap

## What This Is

A field engineering **enablement kit** for Elastic, demonstrating a "Full Chain" search pipeline using **Jina AI models** on **Elastic Inference Service (EIS)**. The scenario: a fictional law firm ("Innocenti & Associates") needs precision search over the **EU AI Act**.

**Audience**: Internal Elastic field engineers and SAs presenting to C-Level/VP audiences.

**Index**: `search-eu-ai-act-demo` (shared by notebooks and UI).

## Project Layout

| Part | Location | Language | Purpose |
|------|----------|----------|---------|
| Data Pipeline | `notebooks/` | Python / Jupyter | Ingest PDF, index, demonstrate reranking |
| Interactive Demo | `ui/` | Next.js 14 (TypeScript) | Search + Agent + Data Lab UI |

Key files:
- `ui/app/page.tsx` -- Main page with mode toggle (Search / Agent / Data Lab)
- `ui/components/AgentChat.tsx` -- Agent chat with SSE parsing, VLM integration, follow-up pills
- `ui/app/api/agent/route.ts` -- SSE proxy to Kibana Agent Builder
- `ui/app/api/agent/followups/route.ts` -- LLM-generated follow-up questions
- `ui/app/api/vision/route.ts` -- Jina VLM diagram analysis
- `ui/app/api/search/route.ts` -- Elasticsearch semantic search + reranking
- `ui/lib/elasticsearch.ts` -- ES client, `semantic` query, `text_similarity_reranker`
- `ui/lib/kibana.ts` -- Kibana URL derivation (`.es.` -> `.kb.`), auth headers
- `ui/scripts/setup-agent.ts` -- Provisions agent + esql tool via Kibana API
- `ui/scripts/setup-demo-index.ts` -- Index creation + data loading
- `.cursor/rules/ui-demo.md` -- Detailed project context rule (file tree, patterns, env vars)

## Environment Setup

Credentials live in `ui/.env.local` (copy from `ui/.env.local.example`). Both UI and notebooks read from this file.

| Variable | Required | Description |
|----------|----------|-------------|
| `ELASTICSEARCH_URL` | Yes* | ES endpoint URL (Serverless standard) |
| `ELASTIC_CLOUD_ID` | Alt* | Classic Cloud deployment ID |
| `ELASTIC_API_KEY` | Yes | API key with index/search/manage permissions |
| `JINA_API_KEY` | Yes | Jina AI API key |
| `AGENT_CONNECTOR_ID` | For Agent | Kibana LLM connector ID |

*One of `ELASTICSEARCH_URL` or `ELASTIC_CLOUD_ID` required.

Kibana URL is auto-derived from `ELASTICSEARCH_URL` by swapping `.es.` for `.kb.`. Override with explicit `KIBANA_URL` if derivation fails.

## Quick Start

```bash
cd ui
npm install
cp .env.local.example .env.local   # fill in credentials
npm run setup                       # create index + load EU AI Act data
npm run setup:agent                 # provision agent + esql tool
npm run dev                         # start dev server at localhost:3000
```

## Three UI Modes

### 1. Text Search (default)
- `POST /api/search` -> `semantic` query on `text` field via `semantic_text` mapping
- "Deep Analysis" triggers reranking via `text_similarity_reranker` retriever
- Bilingual: EN/DE toggle filters by `language` field

### 2. Agent Chat
- `POST /api/agent` -> SSE proxy to Kibana `converse/async` endpoint
- Agent uses `eu-ai-act-search` tool (type: `esql`) with `MATCH` on `semantic_text`
- Image uploads: VLM analysis -> injected as context into agent message
- After each response: `/api/agent/followups` generates contextual follow-up pills via `unified_completion`

### 3. Data Lab
- Interactive visualization of the Jina Reader ingestion pipeline
- `POST /api/ingest` -> SSE progress stream (fetch PDF -> parse -> create endpoints -> index)

## Agent Configuration

### Tool: `eu-ai-act-search` (esql type)

```
FROM search-eu-ai-act-demo METADATA _score
| WHERE MATCH(text, ?query) AND language == ?language
| SORT _score DESC
| KEEP article_number, title, url, text
| LIMIT 5
```

`MATCH` on a `semantic_text` field performs semantic search automatically. The `esql` tool type was chosen over `index_search` because of a `_getType` runtime bug with `index_search` + GPT-4.1 Mini connector.

### Connector Selection

| Connector | Speed | Accuracy | Recommendation |
|-----------|-------|----------|----------------|
| OpenAI GPT-4.1 Mini | ~25s | Correct (cites Annex III) | **Default**: fastest accurate model |
| Claude 4.6 Opus | ~90s | Correct, most thorough | Best for demos where depth matters |
| Claude 4.5 Sonnet | ~45s | Slightly over-classifies | Good mid-tier option |
| Gemini 2.5 Flash | ~30s | Generic, misses high-risk | Fast but shallow |
| Gemini 2.5 Pro | Timeout | N/A | Avoid -- consistently times out |

Set via `AGENT_CONNECTOR_ID` in `.env.local`. All Elastic pre-configured `.inference` connectors with `chat_completion` task type are supported.

### Agent Instructions

The agent has `ARCHITECTURE ANALYSIS RULES` in its system prompt that force:
- Service-by-service breakdown with risk classification
- DEFINITIVE classification (never "could be" or "might be")
- Multiple searches to find specific articles (Annex III, Article 6, etc.)
- Required compliance actions section

## VLM Pipeline

```
Image upload -> POST /api/vision -> Jina VLM (api-beta-vlm.jina.ai)
  -> 4-dimension extraction: data types, outputs, subjects, human review
  -> Analysis cached in component state
  -> Injected into agent message as [Architecture Analysis from VLM] context
```

Cold start: ~45s after idle. Route retries 3x with 15s/30s delays. Warmup endpoint at `/api/vision/warmup` can pre-warm on modal open.

## Key Architectural Decisions

1. **`semantic_text` field**: Embedding happens at ingest via EIS, not at query time. Queries use `semantic` query type.
2. **`esql` over `index_search`**: Avoids `_getType` bug, gives full control over returned fields via `KEEP`.
3. **VLM doesn't judge**: The VLM extracts factual capabilities and data flows. The agent LLM does compliance reasoning.
4. **Follow-ups via `unified_completion`**: Lightweight direct connector call, not full agent pipeline. Uses `subAction: 'unified_completion'` (not `run`).
5. **Kibana URL derivation**: `.es.` -> `.kb.` swap works for Cloud/Serverless. Falls back to explicit `KIBANA_URL`.

## Testing

```bash
make test-all          # notebooks (unit + smoke) + UI (unit + E2E)
cd ui && npm test      # UI unit tests only (Vitest)
cd ui && npm run test:e2e  # E2E browser tests (Playwright)
```

| Suite | Location | What it covers |
|-------|----------|----------------|
| Notebook unit | `notebooks/tests/test_*.py` | Credentials, parsing, inference utils |
| Notebook smoke | `notebooks/tests/test_notebooks_smoke.py` | Full notebook execution with mocked services |
| UI unit | `ui/__tests__/unit/` | Components, API routes (search, agent, vision, followups), lib functions |
| UI E2E | `ui/__tests__/e2e/` | Search flow, agent chat, language toggle, modals (Playwright + Chromium) |

## Demo Workflow

1. Start dev server: `npm run dev`
2. **Search**: Try "biometric identification" -> click Deep Analysis -> show reranking
3. **Agent**: Switch to Agent tab -> ask "What are prohibited AI practices?" -> show tool calls
4. **VLM + Agent**: Upload `public/example-architecture.png` -> ask "Are there any prohibited AI practices?" -> agent identifies RecognizeCelebrities as high-risk
5. **Data Lab**: Show interactive ingestion pipeline visualization

## Presentation (docs/presentation/)

Two versions of a scrolling HTML presentation + PPTX export for a 90-minute internal enablement session (~30 min talk + hands-on).

### Standard Version (straight, no narrative)

Files: `index-standard.html`, `export_pptx_standard.py`, `nanobana2-prompts-standard.md`

Plain technical walkthrough. Section titles like "What Is Jina AI?", "Embedding Models — Lead with v5", etc. Good for async sharing, reference material, or audiences where a fun theme would be distracting.

### Themed Version: "We Might Be Illegal in Europe"

Files: `index.html`, `export_pptx.py`, `nanobana2-prompts-themed.md`

Same technical content, but wrapped in a narrative scenario: your company shipped facial recognition for user onboarding, legal forwarded the EU AI Act, and you need to build a compliance search tool before the lawyers' deadline. Each section has a gold-bordered `.scenario-intro` callout that connects the technical content to the scenario. Wry/dry humor, SE perspective.

### Shared Structure

Both versions share identical technical content, interactive demos, and section order:

| Section | Group | Key Content |
|---------|-------|-------------|
| Title | — | Logos, title, subtitle |
| What Is Jina | jina | Five product families, acquisition context |
| Key Concepts | jina | Embeddings, context window, Matryoshka, LoRA + **embedding similarity demo** (cosine matrix + SVG scatter) |
| Embeddings | jina | v5 hero, v5-text-nano, v4 stats |
| v5 vs ELSER | jina | Comparison table, migration guidance |
| Rerankers | jina | v3 (listwise) vs v2 (pointwise) + **interactive reranker before/after demo** (animated, EU AI Act data) |
| Reader | jina | Reader API, Search mode, ReaderLM v2 + **reader before/after demo** (raw HTML vs clean markdown) |
| CLIP & VLM | jina | CLIP v2 vs VLM specs + **simulated VLM analysis demo** (architecture diagram -> typed response) |
| Quick Reference | jina | Full model table |
| Why It Matters | jina | Customer conversations, vs OpenAI/Cohere |
| Jina API | jina | r.jina.ai, s.jina.ai, api.jina.ai, MCP server |
| What Is EIS | eis | Managed inference, no ML nodes |
| Where Available | eis | Serverless, Hosted, Self-managed via Cloud Connect |
| Three Modes | eis | Pre-configured, Custom EIS, Third-party/BYOK |
| Models on EIS | eis | LLM chat models + embedding + reranker tables |
| How It Works | eis | Pipeline steps + three code blocks (map, search, search+rerank) |
| Hands-On | handson | Three notebooks (ingest, index, rerank) + demo app |

### Interactive Demos (in HTML, JS-driven)

All demos use hardcoded realistic data — not wired to a live cluster. Each has a button to trigger the animation and a reset button.

- **Reranker demo**: 5 EU AI Act articles, "Run Reranker v3" animates reordering with movement indicators. Functions: `runRerank()`, `resetRerank()`
- **Embedding similarity**: Cosine similarity matrix + SVG 2D scatter plot. Built on page load via IIFE.
- **Reader before/after**: Raw HTML panel dims, clean Markdown appears. Functions: `runReader()`, `resetReader()`
- **VLM demo**: Typewriter-style streaming of VLM analysis text. Functions: `runVlm()`, `resetVlm()`

PPTX versions get static screenshot-style slides instead of interactive JS.

### Nano Banana 2 Prompts

`nanobana2-prompts-themed.md` and `nanobana2-prompts-standard.md` contain 6 ready-to-paste prompts for Gemini's Nano Banana 2 image generation model. All use a cinematic visual style: dark background (#0F1117), glowing data-stream lines, soft depth via drop shadows and radial glows, sans-serif font. Brand colors: Jina teal (#009191), Elastic blue (#0B64DD), gold (#FEC514) for emphasis. The themed prompts add narrative hooks from the "We Might Be Illegal in Europe" scenario (e.g., "the question that started the panic", "what the SE had at 2am"); the standard prompts use identical visual style with neutral technical language.

| # | Diagram | Filename | Used In |
|---|---------|----------|---------|
| 1 | Search pipeline architecture | `pipeline-architecture.png` | Overview |
| 2 | Embedding vector space scatter | `embedding-vector-space.png` | Key Concepts |
| 3 | Reranker before/after ranking | `reranker-before-after.png` | Rerankers |
| 4 | Matryoshka dimensions | `matryoshka-dimensions.png` | Key Concepts |
| 5 | VLM analysis flow | `vlm-analysis-flow.png` | CLIP & VLM |
| 6 | EIS before/after architecture | `eis-before-after.png` | What Is EIS |

After generating: save to `docs/presentation/assets/`, add `<img>` tags to `index.html`, and update `export_pptx.py` to include on corresponding slides.

### PPTX Export

```bash
cd docs/presentation
pip3 install python-pptx Pillow
python3 export_pptx.py          # outputs to output/jina-eis-101.pptx (22 slides)
python3 export_pptx_standard.py # outputs standard version
```

Requires `python-pptx`. Logos loaded from `assets/jina-logo.png` and `assets/elastic-logo.png`.

## Related Skills

- `elastic-agent-builder` -- Agent Builder API patterns, SSE format, tool types
- `jina-ai-integration` -- VLM, Embeddings, Reranker, Reader API patterns
- `agent-chat-ui` -- Chat UI component patterns, follow-up pills, VLM handoff
- `elastic-workflows` -- Workflow YAML, step types, Liquid templating
