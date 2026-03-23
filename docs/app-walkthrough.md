# EU AI Act Compliance Tool — Guided Walkthrough

Follow this script during the hands-on portion. The app has three modes: **Search**, **Agent**, and **Data Lab**. Work through them in order.

---

## Prerequisites

Before starting, confirm you have:

- [ ] Elastic Cloud deployment (Serverless or Hosted) with API key
- [ ] Jina API key from [jina.ai](https://jina.ai/api-dashboard/) (free tier works)
- [ ] App running at `http://localhost:3000`

**Quick start:**
```bash
cd ui
cp .env.local.example .env.local   # fill in your keys
npm install
npm run setup                       # loads EU AI Act data (EN + DE)
npm run dev                         # starts on localhost:3000
```

---

## Mode 1: Search (5 min)

**What it shows:** Semantic search via Jina Embeddings v5 on EIS, then precision reranking with Jina Reranker.

### Step 1 — Basic semantic search

Type this query and hit **Search**:

> `Can law enforcement use facial recognition in public spaces?`

**What to notice:**
- The search bar shows which model is embedding your query (`.jina-embeddings-v5-text-small`)
- Results come back ranked by semantic similarity — not keyword matching
- Each result shows the article number and a relevance score

### Step 2 — Deep Analysis (reranking)

Click the **Deep Analysis** button below the results.

**What to notice:**
- The button says "Reranking with Jina Reranker..." while processing
- Results re-order — the reranker reads the **full text** of each article alongside your query
- Compare the before/after: the most legally precise article should move up
- Articles about **exceptions for law enforcement** (the nuanced answer) should rank higher after reranking

### Step 3 — Try more queries

Try these to see how semantic search handles different phrasings:

| Query | What it tests |
|-------|--------------|
| `What penalties exist for non-compliance?` | Direct factual lookup |
| `Who is responsible when an AI system causes harm?` | Liability / accountability |
| `biometric identification exceptions` | Short, keyword-like query |
| `Ausnahmen für Strafverfolgungsbehörden` | German query — tests multilingual embeddings |

For each: search first, then click **Deep Analysis** to see how reranking changes the order.

### Step 4 — Language toggle

Switch the language toggle (top right) to **DE** and search in German. The same index has both English and German articles — `semantic_text` handles cross-lingual search automatically.

### Step 5 — Architecture diagram audit (optional)

Click the **image icon** (📷) next to the search bar. Upload any architecture diagram (or a screenshot of one). Jina VLM analyzes it and auto-generates a compliance search query.

> **Note:** First use may take up to 60 seconds (cold start). The app shows a warmup modal.

---

## Mode 2: Agent (5 min)

Click **Agent** in the mode toggle at the top.

**What it shows:** A RAG-powered compliance advisor using Kibana Agent Builder + an LLM, with Elasticsearch as the retrieval tool.

### Step 1 — Ask a compliance question

Type:

> `We're building a hiring tool that screens resumes using AI. What do we need to comply with under the EU AI Act?`

**What to notice:**
- **Thinking** — the agent reasons about your question
- **Tool calls** — it searches the EU AI Act index (you'll see the search query it generates)
- **Results** — it pulls specific articles from Elasticsearch
- **Response** — a structured answer citing specific articles

### Step 2 — Follow-up questions

The agent suggests follow-up questions after each response. Click one, or ask your own:

> `What risk category does our hiring tool fall under?`

> `Do we need a conformity assessment?`

### Step 3 — Diagram audit via agent

Click the **image icon** in the chat input. Upload an architecture diagram. The agent will:
1. Analyze it with Jina VLM
2. Identify AI components
3. Search for relevant regulations
4. Give a compliance assessment

### Suggested questions to try

| Question | What it demonstrates |
|----------|---------------------|
| `Summarize Article 6 — what makes an AI system high-risk?` | Direct article retrieval + summarization |
| `We use facial recognition for building access. Is that allowed?` | Multi-article reasoning |
| `What's the difference between high-risk and limited-risk systems?` | Comparative analysis across articles |
| `Our chatbot talks to customers. What transparency rules apply?` | Targeted regulation lookup |

---

## Mode 3: Data Lab (3 min)

Click **Data Lab** in the mode toggle.

**What it shows:** The full ingestion pipeline — from raw PDF to indexed, searchable documents. See exactly what happens under the hood.

### Step 1 — Review current state

The Data Lab shows:
- **Index name** and total document count
- **Language split** (EN vs DE articles)
- **Sample articles** — preview what's in the index

### Step 2 — Run the pipeline

If the index is empty (or you want to re-ingest):

1. Enter your Jina API key if prompted (or it uses the server-side key from `.env.local`)
2. Select language: **EN**, **DE**, or **Both**
3. Click **Process Data**

**Watch the 5-stage pipeline animate:**

| Stage | What happens | Powered by |
|-------|-------------|------------|
| **Jina Reader** | Fetches EU AI Act from EUR-Lex, converts HTML → clean markdown | `r.jina.ai` |
| **Parse Articles** | Splits markdown by article boundaries into individual documents | Regex parsing |
| **Jina Inference** | Configures embedding + reranker endpoints via ES Inference API | EIS + Jina |
| **Index Documents** | Bulk indexes with `semantic_text` — embeddings generated automatically | Elasticsearch |
| **Complete** | Pipeline done, documents searchable | — |

### What to point out

- **No explicit embedding call** — `semantic_text` handles it at index time
- **The pipeline is the same one you built in Notebook 01** — just automated
- After indexing completes, switch back to **Search** mode and try a query on the freshly indexed data

---

## Key talking points during the walkthrough

1. **One field type:** `semantic_text` handles embedding automatically — no ML pipeline to build
2. **Pre-configured endpoints:** `.jina-embeddings-v5-text-small` exists on every Serverless/Cloud Hosted cluster, zero setup
3. **Reranking matters:** Show the before/after comparison — the reranker finds the legally precise answer, not just the broadly relevant one
4. **Multilingual for free:** Same model, same index — German queries find English articles and vice versa
5. **Same Inference API shape:** Whether it's embeddings, reranking, or chat — it's all `_inference/{task}/{id}`
