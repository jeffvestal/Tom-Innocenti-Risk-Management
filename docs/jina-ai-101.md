# Jina AI — 101 Overview

> **Audience**: Internal Elastic field engineers, SAs, and anyone who needs a quick ramp-up on Jina AI and its models.
>
> **Companion doc**: [Elastic Inference Service Primer](eis-primer.md) — how customers access these models inside Elasticsearch.

---

## What Is Jina AI?

Jina AI is a Berlin-based AI company **acquired by Elastic in October 2025**. They build **search foundation models** — the ML models that sit between your data and your search results. They turn "dumb" keyword lookup into intelligent meaning-based retrieval.

Jina is not a search engine. They build the models that make search engines _smart_ — converting text into mathematical representations that capture meaning, re-scoring search results for precision, cleaning up messy web content, and answering questions about images.

All current Jina models (v3+) are licensed **CC BY-NC 4.0** — free for evaluation, commercial use through Elastic.

---

## Key Concepts — Quick Primer

Before diving into models, here are the foundational ideas you'll need for customer conversations.

### What Is an Embedding?

When an AI model reads text, it converts it into a list of numbers — a **vector**. The key insight: similar meanings produce similar numbers. A search for "how to fix a leaky faucet" will match a document about "repairing dripping taps" even though the exact words are completely different. This is how semantic search works.

### What Is a Context Window?

The maximum amount of text a model can process in a single pass, measured in tokens (~1 token ≈ 1 word). A 512-token window handles about one paragraph. **8K tokens ≈ 6 pages. 32K tokens ≈ 25 pages.** Longer context = fewer chunks, less lost meaning at boundaries, better search quality for long documents.

### What Is Matryoshka Representation Learning?

Named after Russian nesting dolls. The model **front-loads the most important information into the first dimensions** of the embedding. You can truncate from 1,024 down to 256 dimensions and keep 90%+ of search quality. This lets customers trade a tiny accuracy reduction for major storage savings and faster searches.

### What Are LoRA Adapters?

Small, lightweight plugin modules (a few million extra parameters) attached to one base model. Instead of deploying separate models for retrieval, classification, and clustering, customers **deploy one model and switch tasks by selecting the adapter at query time**. One deployment, not three. Simpler infrastructure, lower cost.

---

## The Model Families

Jina's products fall into five categories. Each solves a different part of the search and AI pipeline.

### 1. Embedding Models (`jina-embeddings`)

Convert text (and images) into numerical vectors so search systems can find content **by meaning, not just keywords**. This is the foundation of any semantic search or RAG system.

#### Lead with v5-text-small

**v5-text-small is becoming the default embedding model on Elastic, replacing ELSER** as the go-to for new deployments. Best search quality of any multilingual model under 1B parameters. If you're recommending ELSER today, recommend v5-text-small instead.

| Model | Params | Dimensions | Context | Languages | On EIS? | Status |
|-------|--------|-----------|---------|-----------|---------|--------|
| **v5-text-small** | 677M | 1,024 | 32K tokens | 119+ | Yes | **New Default** |
| **v5-text-nano** | 239M | 768 | 32K tokens | Multilingual | Yes | Active |
| v4 (multimodal) | 3.8B | 2,048 | 32K tokens | 30+ | No | Active |
| v3 | 570M | 1,024 | 8K tokens | 89 | Yes | Legacy on EIS |

**When to recommend which:**
- **v5-text-small** — Default for most text search and RAG. Best quality-to-cost ratio under 1B params.
- **v5-text-nano** — Edge deployments, latency-sensitive apps, budget-constrained environments. Matches models with 2× its size.
- **v4** — Documents with charts, images, slides, or scans. The only option for multimodal (text + image) embedding.

Key features across the family:
- **Matryoshka dimensions** — Truncate embeddings (e.g., 1,024 down to 256) with minimal quality loss, trading accuracy for storage savings.
- **LoRA adapters** — One model serves multiple tasks (retrieval, classification, clustering) by switching adapters at query time. Deploy once, not N times.
- **Binary quantization** — Compress vectors to binary representation; still robust for most search workloads.

#### v5-text-small vs ELSER — Why the Switch?

ELSER was a great first step — it brought learned sparse retrieval to Elastic and worked well for English keyword-expansion style search. But v5 is a generational leap: true multilingual semantic search with 64× longer context.

| Dimension | ELSER v2 | Jina v5-text-small |
|-----------|----------|-------------------|
| Type | Sparse (learned sparse) | Dense (vector) |
| Languages | English-focused | 119+ languages |
| Context Window | 512 tokens (~1 paragraph) | 32K tokens (~25 pages) |
| Dimensions | Sparse (variable) | 1,024 (truncatable via Matryoshka) |
| Long Documents | Needs aggressive chunking | 25 pages in a single pass |
| Task Adapters | None | 4 LoRA adapters |
| On EIS | Yes | Yes |
| Status | Legacy default | **New default** |

**Bottom line:** ELSER = English keyword expansion. v5-text-small = true multilingual semantic understanding with 64× more context. For new deployments, always recommend v5-text-small.

### 2. Reranker Models (`jina-reranker`)

Take initial search results and **re-order them by relevance** with deeper analysis than embeddings alone.

**Why two stages?** Embedding search is fast and scales to millions of documents, but it works by comparing pre-computed vectors and can miss subtle relationships. A reranker reads each candidate alongside the query in full detail and re-scores them. You get speed from embeddings (find 100 candidates in milliseconds) and precision from reranking (surface the best 10).

| Model | Params | Context | Languages | Scoring | On EIS? | Status |
|-------|--------|---------|-----------|---------|---------|--------|
| **v3** | 600M | 131K tokens | 100+ | Listwise | Yes | **Recommended** |
| **v2-base-multilingual** | 278M | 1K tokens | 100+ | Pointwise | Yes | Active |

**v3 vs v2**: The v3 reranker is fundamentally different — it scores all candidates simultaneously (listwise) rather than one at a time (pointwise). It compares documents against _each other_, not just against the query. This produces better rankings, especially when multiple results are somewhat relevant.

**The analogy**: Embedding search is scanning a library catalog to find the right shelf. The reranker is a librarian who reads the actual pages and tells you which books best answer your specific question.

### 3. Jina Reader — Content Pipeline Service

Jina Reader is a **full service** (not just a model) for preprocessing raw web content into clean, structured data. Before documents can be embedded, indexed, or searched, they need to be clean. Raw web pages are full of JavaScript, CSS, ads, and navigation noise. Reader handles this preprocessing.

**Three Access Modes:**

| Mode | URL | Description |
|------|-----|-------------|
| **Reader API** | `r.jina.ai/{url}` | Prepend to any URL. Returns clean Markdown. Handles HTML, PDFs, dynamic JS pages. |
| **Search Mode** | `s.jina.ai/{query}` | Searches the web and returns top 5 results already converted to clean Markdown. |
| **ReaderLM v2** (Model) | Deploy locally | The underlying 1.5B-param model. HTML → Markdown _and_ HTML → structured JSON extraction using predefined schemas. 29 languages, 512K context. |

Outperforms models 20× its size on HTML-to-Markdown quality benchmarks. Every RAG pipeline starts with clean data — Reader ensures AI models get high-quality input instead of noisy HTML.

### 4. CLIP v2 — Cross-Modal Search (`jina-clip`)

**Cross-modal embedding** — separate text and image encoders trained to produce embeddings in the **same vector space**. A text query like "red sports car" finds matching images. An image of a car finds matching product descriptions. This is cross-modal retrieval.

| Model | Params | Dimensions | Languages | Status |
|-------|--------|-----------|-----------|--------|
| **v2** | 865M | 1,024 | 89 | **Current** |

- 512×512 image resolution (4× v1)
- Matryoshka: truncate 1,024 → 64 dims with <1% loss
- Lighter than v4 — choose CLIP v2 for speed/cost when you don't need document understanding

### 5. VLM — Vision Language Model (`jina-vlm`)

A **generative** model that looks at an image and produces text answers to questions about it. Not retrieval — understanding. "What does this chart show?" "What text is in this scanned document?"

| Model | Params | Languages | Status |
|-------|--------|-----------|--------|
| **jina-vlm** | 2.4B | 29 | Active |

- Best multilingual VQA among open 2B models
- Strong OCR (778/1000 OCRBench)
- Lowest hallucination rate (90.3 POPE score) in its class

**CLIP vs VLM vs v4**: CLIP v2 embeds images for _search_ (lightweight, fast). v4 embeds images + text together for _multimodal search_ (heavier, handles complex visual docs). VLM _generates text_ about images (answers questions, extracts info). They can be used together in a pipeline.

---

## Quick Reference — Every Current Model

| Model | Type | Params | Context | Languages | On EIS? | Best For |
|-------|------|--------|---------|-----------|---------|----------|
| v5-text-small | Embedding | 677M | 32K | 119+ | Yes | Default for text search and RAG |
| v5-text-nano | Embedding | 239M | 32K | Multi | Yes | Edge, low-latency, budget |
| v4 | Embedding | 3.8B | 32K | 30+ | No | Visual documents, multimodal search |
| jina-clip-v2 | CLIP | 865M | 8K | 89 | No | Cross-modal text ↔ image search |
| jina-reranker-v3 | Reranker | 600M | 131K | 100+ | Yes | Best accuracy, listwise scoring |
| jina-reranker-v2 | Reranker | 278M | 1K | 100+ | Yes | Fast, compact, function-calling |
| ReaderLM v2 | SLM | 1.5B | 512K | 29 | No | HTML/PDF to clean Markdown/JSON |
| jina-vlm | VLM | 2.4B | Multi-img | 29 | No | Visual QA, OCR, image understanding |

---

## Who Cares and Why

### For Field Engineers Pitching Semantic Search
These are the models powering it. When a customer asks "how does Elastic do semantic search?", the answer is: Jina embedding models (on EIS) convert text to vectors, and Jina rerankers improve precision — all managed inside Elasticsearch with zero separate infrastructure.

### For SAs Scoping Deployments
The model choice depends on the customer's content, languages, and infrastructure:
- **Pure text search?** → v5-text-small on EIS. Done.
- **Documents with images/charts?** → v4.
- **Tight on budget/latency?** → v5-text-nano.
- **Need reranking precision?** → Add Reranker v3.
- **Quick PoC?** → v5-text-small on EIS. One API call, one field type change. Working prototype in under an hour.

### Compared to OpenAI / Cohere Embeddings
- **No external API calls** — Jina on EIS runs inside Elasticsearch
- **No data leaving the cluster** — only text sent for inference is transmitted and discarded after processing
- **Predictable costs** — part of Elastic Cloud subscription, not per-token third-party pricing
- **Equivalent or better quality** — v5-text-small matches or exceeds OpenAI embedding quality on standard benchmarks
- **OpenAI-compatible API schema** — migration is straightforward

### Common Customer Questions

**"Do we need both embeddings and a reranker?"**
Embeddings alone give good results. A reranker significantly improves the quality of the _top_ results. For precision-critical use cases (legal, medical, financial), strongly recommended. For simpler search, embeddings alone may be sufficient.

**"Which model for a quick proof of concept?"**
v5-text-small on EIS. One API call to configure the inference endpoint, one field type change to enable semantic search. Working prototype in under an hour.

---

## How Customers Access Jina Models

| Method | Setup | Best For |
|--------|-------|----------|
| **Elastic Inference Service (EIS)** | Managed endpoints inside Elasticsearch — no separate infra | Most Elastic customers ([details](eis-primer.md)) |
| **Jina API** | Direct REST at `jina.ai` / `api.jina.ai`, free tier available | Quick prototyping, evaluation |
| **Cloud Marketplaces** | AWS SageMaker, Azure, GCP | Private infra, data residency requirements |
| **HuggingFace / Local** | Download weights, multiple formats (ONNX, GGUF, MLX) | Research, evaluation, edge deployment |

For Elastic customers, **EIS is the simplest path**. See the [EIS Primer](eis-primer.md) for setup details.

### Jina API Service — jina.ai

All Jina models are available directly via a REST API at **jina.ai** — no Elastic cluster required. Instant access, no credit card or registration needed. SOC 2 Type 1 & 2 compliant (AICPA).

**Three product APIs:**

| API | Endpoint | What It Does |
|-----|----------|-------------|
| **Reader** | `r.jina.ai/{url}` | Convert any URL to clean Markdown for LLM grounding |
| **Search** | `s.jina.ai/{query}` | Search the web, get top results already converted to Markdown |
| **Embeddings** | `api.jina.ai/v1/embeddings` | Generate embeddings (all Jina embedding models) |
| **Reranker** | `api.jina.ai/v1/rerank` | Re-score and re-order documents by relevance |
| **MCP Server** | `mcp.jina.ai` | Access Reader, Embeddings, and Reranker from LLMs/agents via MCP |

**Getting an API key:**
1. Go to [jina.ai](https://jina.ai/)
2. Click "How to get my API key?"
3. Key appears in the **API Key & Billing** tab
4. Free tier available with rate limits; add your key to requests for higher throughput

**Reader API** requires no API key for basic use — just prepend `r.jina.ai/` to any URL:
```
curl "https://r.jina.ai/https://example.com"
```

**Embeddings and Reranker** require an API key via `Authorization: Bearer <KEY>` header.

> **Jina API vs EIS**: The Jina API is great for prototyping and non-Elastic use cases. For production Elastic deployments, use **EIS** — same models, but managed inside Elasticsearch with no external calls, no data leaving the cluster, and integrated billing.

---

## See It in Action

This enablement kit demonstrates these models working end-to-end:

| What | Where | Jina Models Used |
|------|-------|-----------------|
| PDF ingestion with Jina Reader | [`notebooks/01_ingest.ipynb`](../notebooks/01_ingest.ipynb) | ReaderLM (via Reader API) |
| Zero-config semantic indexing | [`notebooks/02_index.ipynb`](../notebooks/02_index.ipynb) | Embeddings v5 (via EIS) |
| Reranking for precision | [`notebooks/03_rerank.ipynb`](../notebooks/03_rerank.ipynb) | Reranker v2/v3 (via EIS) |
| Semantic search UI | [`ui/`](../ui/) — Search tab | Embeddings v5 + Reranker v3 |
| AI agent with tool use | [`ui/`](../ui/) — Agent tab | Embeddings v5 (via Agent Builder) |
| Architecture diagram analysis | [`ui/`](../ui/) — Agent tab (image upload) | VLM |
| Interactive ingestion pipeline | [`ui/`](../ui/) — Data Lab tab | Reader API + Embeddings v5 |
