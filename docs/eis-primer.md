# Elastic Inference Service (EIS) — Primer

> **Audience**: Internal Elastic field engineers, SAs, and anyone who needs a quick ramp-up on EIS.
>
> **Companion doc**: [Jina AI 101](jina-ai-101.md) — the models that power search and reranking on EIS.

---

## What Is EIS?

**Elastic Inference Service (EIS)** is managed ML inference as a service. It lets you run embedding, reranking, and LLM chat models **without deploying ML nodes or managing GPUs**. Models run on Elastic's infrastructure, not in your cluster.

Historically, running ML models in Elasticsearch meant provisioning dedicated ML nodes, managing GPU resources, scaling allocations, and monitoring model health. That's a lot of infrastructure just to enable semantic search. EIS eliminates all of that.

The key idea: instead of provisioning and scaling ML nodes to run models yourself, EIS handles all of that. You configure an inference endpoint — one API call — and Elasticsearch uses it automatically for ingest, search, and chat. Zero infrastructure to manage.

- **No ML nodes** to provision or scale
- **No GPU management** — Elastic handles infrastructure
- **Billed per million tokens**, not VCU hours or node count
- **Data stays in your cluster** — only the text sent for inference is transmitted to EIS and discarded after processing

> **Docs**: [Elastic Inference Service](https://www.elastic.co/docs/explore-analyze/elastic-inference/eis)

---

## Where Is It Available?

EIS is available across all Elastic deployment types, with different setup requirements.

| Deployment Type | EIS Availability | Setup Required | Stack Version |
|-----------------|-----------------|----------------|---------------|
| **Elastic Cloud Serverless** | Built-in, zero setup | None — pre-configured endpoints ready to use | GA |
| **Elastic Cloud Hosted (ECH)** | Built-in, zero setup | None — pre-configured endpoints ready to use | GA |
| **Self-managed (standalone, ECE, ECK)** | Via **Cloud Connect** | Connect cluster to Elastic Cloud, enable EIS | 9.3+ |

### Cloud Connect for Self-Managed

Self-managed clusters (including ECE and ECK) access EIS through [Cloud Connect](https://www.elastic.co/docs/deploy-manage/cloud-connect), which bridges your cluster to Elastic Cloud services without hosting them locally.

**Prerequisites**:
- Elastic Cloud account (active trial or billing configured)
- Enterprise self-managed license or active self-managed trial
- Elastic Stack 9.3+

After connecting, Elasticsearch **automatically creates** inference endpoints for search and chat, plus corresponding Kibana AI connectors. Supported Kibana features (Agent Builder, AI Assistants, Attack Discovery) use these connectors automatically.

> **Docs**: [EIS for self-managed clusters](https://www.elastic.co/docs/explore-analyze/elastic-inference/connect-self-managed-cluster-to-eis)

---

## How EIS Works — The Three Modes

There are three ways to use inference endpoints in Elasticsearch, and it's important to understand which is which.

### 1. Pre-configured (Default) Endpoints

These exist out of the box on Cloud Hosted, Serverless, and Cloud Connect deployments. No API calls needed to create them. Just reference them.

On **Serverless**, these use dot-prefixed inference IDs:

| Inference ID | Model | Task |
|-------------|-------|------|
| `.jina-embeddings-v5-text-small` | Jina Embeddings v5 Small | text_embedding |
| `.jina-embeddings-v5-text-nano` | Jina Embeddings v5 Nano | text_embedding |
| `.jina-embeddings-v3` | Jina Embeddings v3 | text_embedding |
| `.jina-reranker-v3` | Jina Reranker v3 | rerank |
| `.jina-reranker-v2-base-multilingual` | Jina Reranker v2 | rerank |
| `.elser-2-elastic` | ELSER v2 (on EIS) | sparse_embedding |

Use them directly in mappings with zero configuration:

```json
PUT my-index
{
  "mappings": {
    "properties": {
      "text": {
        "type": "semantic_text",
        "inference_id": ".jina-embeddings-v5-text-small"
      }
    }
  }
}
```

On **Cloud Hosted / Cloud Connect**, inference endpoints are also pre-created for all supported models. Some use the same dot-prefixed IDs; others are created with standard IDs.

### 2. Custom EIS Endpoints (Elastic-Managed Models)

Create your own endpoints pointing to EIS-managed models using `"service": "elastic"`. This gives you control over the inference ID and settings while still running on Elastic's infrastructure.

```json
PUT _inference/text_embedding/my-jina-v5
{
  "service": "elastic",
  "service_settings": {
    "model_id": "jina-embeddings-v5-text-small"
  }
}
```

Use this when you want a custom inference ID or need multiple endpoints for the same model with different configurations.

### 3. Third-Party / BYOK Endpoints

Create endpoints that call external providers using your own API keys. Inference runs externally but is orchestrated through the Elasticsearch Inference API.

```json
PUT _inference/text_embedding/my-openai-embeddings
{
  "service": "openai",
  "service_settings": {
    "model_id": "text-embedding-3-small",
    "api_key": "<YOUR_OPENAI_API_KEY>"
  }
}
```

Supported third-party services include: OpenAI, Anthropic, Azure OpenAI, Google AI Studio, Google Vertex AI, Cohere, Amazon Bedrock, Amazon SageMaker, Mistral, Hugging Face, Nvidia, Groq, DeepSeek, Watsonx, VoyageAI, AlibabaCloud, and more. You can also use the `custom` service for any provider not explicitly supported.

> **Key difference**: Modes 1 and 2 run inference on Elastic's infrastructure (EIS). Mode 3 sends requests to external providers. All three are managed through the same Inference API.

---

## What Models Are Available on EIS?

### LLM Chat Models

Auto-provisioned as Kibana connectors. Used in Agent Builder, AI Assistants, Attack Discovery, Search Playground.

| Author | Model | ID | Status |
|--------|-------|-----|--------|
| Anthropic | Claude Opus 4.6 | `anthropic-claude-4.6-opus` | GA |
| Anthropic | Claude Sonnet 4.6 | `anthropic-claude-4.6-sonnet` | Beta |
| Anthropic | Claude Opus 4.5 | `anthropic-claude-4.5-opus` | GA |
| Anthropic | Claude Sonnet 4.5 | `anthropic-claude-4.5-sonnet` | GA |
| Anthropic | Claude Haiku 4.5 | `anthropic-claude-4.5-haiku` | Beta |
| Anthropic | Claude Sonnet 3.7 | `rainbow-sprinkles` | GA (legacy) |
| Google | Gemini 2.5 Pro | `google-gemini-2.5-pro` | GA |
| Google | Gemini 2.5 Flash | `google-gemini-2.5-flash` | GA |
| Google | Gemini 2.5 Flash Lite | `google-gemini-2.5-flash-lite` | Beta |
| OpenAI | GPT-5.2 | `openai-gpt-5.2` | GA |
| OpenAI | GPT-4.1 | `openai-gpt-4.1` | GA |
| OpenAI | GPT-4.1 Mini | `openai-gpt-4.1-mini` | GA |
| OpenAI | GPT-OSS 120B | `openai-gpt-oss-120b` | GA |

All LLMs: 0-day data retention, data NOT used to train models, inference in US region.

### Embedding Models

| Model | ID | Dimensions | Service |
|-------|-----|-----------|---------|
| **Jina v5 Small** | `jina-embeddings-v5-text-small` | 1,024 | EIS |
| **Jina v5 Nano** | `jina-embeddings-v5-text-nano` | 768 | EIS |
| Jina v3 | `jina-embeddings-v3` | 1,024 | EIS |
| ELSER v2 (EIS) | `elser_model_2` | sparse | EIS |
| ELSER v2 (ML node) | `.elser_model_2_linux-x86_64` | sparse | Elasticsearch |
| E5 Large | `microsoft-multilingual-e5-large` | 1,024 | EIS (Beta) |
| E5 Small (ML node) | `.multilingual-e5-small_linux-x86_64` | — | Elasticsearch |
| Gemini Embedding 001 | `google-gemini-embedding-001` | 768 | EIS |
| OpenAI Text Emb 3 Large | `openai-text-embedding-3-large` | 3,072 | EIS |
| OpenAI Text Emb 3 Small | `openai-text-embedding-3-small` | 1,536 | EIS |

### Rerankers

| Model | ID | Service |
|-------|-----|---------|
| **Jina Reranker v3** | `jina-reranker-v3` | EIS |
| **Jina Reranker v2** | `jina-reranker-v2-base-multilingual` | EIS |
| Rerank v1 (ML node) | `.rerank-v1` | Elasticsearch |

---

## How to Use It

### The `semantic_text` Field Type

The simplest path. Map a field as `semantic_text`, point it at an inference endpoint, and Elasticsearch handles everything — embeddings at ingest time, query embedding at search time.

```json
PUT my-index
{
  "mappings": {
    "properties": {
      "text": {
        "type": "semantic_text",
        "inference_id": ".jina-embeddings-v5-text-small"
      }
    }
  }
}
```

Index documents normally — Elasticsearch auto-generates embeddings:

```json
POST my-index/_doc
{
  "text": "Aberdeen Football Club"
}
```

Search with a simple `match` query — semantic matching happens automatically:

```json
GET my-index/_search
{
  "query": {
    "match": {
      "text": "soccer"
    }
  }
}
```

This returns "Aberdeen Football Club" because the model understands that football and soccer are semantically related.

### Adding Reranking

Use the `text_similarity_reranker` retriever to add a second-stage reranking pass:

```json
GET my-index/_search
{
  "retriever": {
    "text_similarity_reranker": {
      "retriever": {
        "standard": {
          "query": {
            "semantic": {
              "field": "text",
              "query": "facial recognition in public spaces"
            }
          }
        }
      },
      "field": "text",
      "inference_id": ".jina-reranker-v3",
      "inference_text": "facial recognition in public spaces",
      "rank_window_size": 50
    }
  }
}
```

This retrieves the top 50 candidates via semantic search, then re-ranks them with the Jina Reranker v3 for higher precision.

### Creating Custom Inference Endpoints

For Jina models on Classic Cloud (not Serverless), you may need to create endpoints via the Inference API:

```json
PUT _inference/text_embedding/my-jina-embeddings
{
  "service": "elastic",
  "service_settings": {
    "model_id": "jina-embeddings-v5-text-small"
  }
}
```

For third-party models with your own API key (e.g., using the `jinaai` service directly):

```json
PUT _inference/text_embedding/my-jina-direct
{
  "service": "jinaai",
  "service_settings": {
    "model_id": "jina-embeddings-v3",
    "api_key": "<YOUR_JINA_API_KEY>"
  }
}
```

---

## Region, Rate Limits, and Pricing

### Region

EIS currently runs in **AWS `us-east-1`**. All inference requests route there regardless of where your deployment lives. ELSER runs entirely within Elastic infrastructure. LLMs and some third-party embedding models may involve trusted third-party providers.

### Rate Limits

| Model | Requests/min | Ingest tokens/min | Search tokens/min |
|-------|-------------|-------------------|-------------------|
| Elastic Managed LLMs | 2,000 | — | — |
| ELSER | 6,000 | 6,000,000 | 600,000 |
| Jina Embeddings v3 | 6,000 | 6,000,000 | 600,000 |
| Jina Reranker v2 | 50 | — | 500,000 |
| Jina Reranker v3 | 50 | — | 500,000 |

### Pricing

- Billed **per million tokens** (not VCU hours)
- Embedding models: input tokens only
- Chat models: input + output tokens
- Track usage: Elastic Cloud Console > Billing and subscriptions > Usage (filter by "Inference")

---

## Gotchas and Tips

**Jina `api_key` placement** — When creating a `jinaai` service endpoint (not `elastic` service), the `api_key` must go inside `service_settings`, NOT in a separate `secret_settings` block.

**No `task_settings` for Jina** — The `jinaai` service rejects unknown task settings. Do not include `task_settings` like `{ "task": "retrieval.passage" }`.

**`elastic` vs `jinaai` service** — Use `"service": "elastic"` for EIS-managed Jina models (no API key needed, runs on Elastic infrastructure). Use `"service": "jinaai"` only for direct Jina API access with your own key.

**Pre-configured endpoints don't need creation** — On Serverless, the dot-prefixed endpoints (`.jina-embeddings-v5-text-small`, etc.) exist automatically. Calling `PUT _inference` to create them will fail or create duplicates.

**`semantic_text` defaults** — On Serverless, if you omit `inference_id` from a `semantic_text` mapping, Elasticsearch uses a default inference endpoint. On Cloud Hosted with Cloud Connect, the default endpoint is also pre-configured after EIS enablement.

---

## Features Powered by EIS

EIS isn't just for search. These Kibana features use EIS-managed LLM connectors:

- **Agent Builder** — Build conversational AI agents with tool use
- **AI Assistants** — Observability, Security, and Search AI assistants
- **Attack Discovery** — Automated security threat analysis
- **Automatic Import** — AI-guided data integration
- **Search Playground** — Interactive RAG experimentation

---

## See It in Action

This enablement kit demonstrates EIS across the full search pipeline:

| What | Where | EIS Usage |
|------|-------|-----------|
| Zero-config semantic indexing | [`notebooks/02_index.ipynb`](../notebooks/02_index.ipynb) | Jina Embeddings v5 via EIS `semantic_text` |
| Reranking for precision | [`notebooks/03_rerank.ipynb`](../notebooks/03_rerank.ipynb) | Jina Reranker via EIS `text_similarity_reranker` |
| Semantic search UI | [`ui/`](../ui/) — Search tab | Embeddings + Reranker via EIS |
| AI agent with tool use | [`ui/`](../ui/) — Agent tab | LLM connectors via EIS |

---

## Further Reading

- [EIS overview](https://www.elastic.co/docs/explore-analyze/elastic-inference/eis)
- [EIS for self-managed clusters](https://www.elastic.co/docs/explore-analyze/elastic-inference/connect-self-managed-cluster-to-eis)
- [Cloud Connect](https://www.elastic.co/docs/deploy-manage/cloud-connect)
- [Inference API reference](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-inference-put)
- [Semantic search with `semantic_text`](https://www.elastic.co/docs/solutions/search/semantic-search/semantic-search-semantic-text)
- [Inference integrations](https://www.elastic.co/docs/explore-analyze/elastic-inference/inference-api)
