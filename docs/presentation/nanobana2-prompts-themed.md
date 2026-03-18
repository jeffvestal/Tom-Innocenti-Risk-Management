# Nano Banana 2 Image Generation Prompts

Ready-to-paste prompts for "We Might Be Illegal in Europe" — the themed Jina + EIS presentation.
Save generated images to `docs/presentation/assets/` and reference them via `<img>` tags in `index.html`.
(Standard/unthemed prompts preserved in `nanobana2-prompts-standard.md`.)

---

## 1. Search Pipeline Architecture Diagram

**Filename:** `pipeline-architecture.png`
**Used in:** Overview / pipeline section

> Create a cinematic technical architecture diagram on a dark background (#0F1117) showing a compliance search pipeline. The visual mood should feel like a late-night war room — urgent, purposeful, slightly dramatic. Flow left to right through 7 stages connected by glowing teal (#009191) data-stream lines with subtle particle effects: (1) "EU AI Act PDF" — a thick regulatory document icon with a subtle EU stars watermark, faintly ominous (2) Jina Reader — teal (#009191) rounded box labeled "Clean & Structure", with a faint glow suggesting processing (3) Jina Embeddings v5 — teal box labeled "Vectorize", text fragments visually dissolving into a floating vector array (4) Elasticsearch Index — blue (#0B64DD) database icon with "semantic_text" label, a calm anchor in the center (5) Search Query — a glowing input field reading "Can law enforcement use facial recognition?" — the question that started the panic (6) Jina Reranker v3 — teal box labeled "Precision Rerank", results visually shuffling into correct order (7) "Article 6 — High-Risk Classification" — the final answer, highlighted with a gold (#FEC514) accent border. Use teal (#009191) for Jina components, blue (#0B64DD) for Elastic components, and gold (#FEC514) sparingly for emphasis. Add subtle depth with soft glows and drop shadows — not flat, but not over-the-top. Sans-serif font. 1200x400px, presentation slide format.

---

## 2. Embedding Vector Space Visualization

**Filename:** `embedding-vector-space.png`
**Used in:** Key Concepts section (next to the similarity matrix)

> Create a 2D scatter plot visualization on a dark background (#0F1117) with a constellation / star-field atmosphere — documents as glowing points in vector space, faint connecting lines between cluster members like neural pathways. Plot ~15 dots across 3 clusters: Cluster 1 (teal glow, #009191): "AI regulation", "artificial intelligence law", "EU AI Act" — tight group, connected by faint teal filaments. Cluster 2 (blue glow, #0B64DD): "facial recognition", "biometric identification", "surveillance systems" — separate cluster, connected by faint blue filaments. Cluster 3 (gold glow, #FEC514): "renewable energy", "solar panels" — distant outliers, obviously irrelevant. A search query dot (bright white, larger, pulsing glow) labeled "biometric regulation — the term that lit up legal's inbox" sits between clusters 1 and 2, with faint dotted gravitational-pull lines to its nearest neighbors. Each dot has a tiny text label in a soft sans-serif font. No axes, no grid — just the void and the clusters. Subtle depth via soft radial glow behind each cluster. 800x500px, presentation slide format.

---

## 3. Reranker Before/After Ranking Diagram

**Filename:** `reranker-before-after.png`
**Used in:** Rerankers section (static backup for the interactive demo)

> Create a side-by-side "Before → After" reranking diagram. Dark background (#0F1117), teal (#009191) accent line at top. Sans-serif font. 900×500px.
>
> **Left panel — "Before: what the first search returned"**
> Five numbered result rows, muted grey bars with faded scores:
>
> | # | Label | Score |
> |---|-------|-------|
> | 1 | Result A | 0.82 |
> | 2 | Result B | 0.79 |
> | 3 | Result C | 0.77 |
> | 4 | Result D | 0.75 |
> | 5 | Result E | 0.71 |
>
> **Right panel — "After: what the partner actually needed"**
> Same five results but in a completely different order, clean and bright:
>
> | # | Label | Note |
> |---|-------|------|
> | 1 | Result D | gold (#FEC514) glow, tagged "Most Relevant — was #4" |
> | 2 | Result C | was #3 |
> | 3 | Result A | was #1 |
> | 4 | Result E | was #5 |
> | 5 | Result B | was #2 |
>
> **Arrows between panels:** Draw one curved teal (#009191) arrow per result connecting its old position on the left to its new position on the right. The arrows must visibly cross each other to show the shuffle — this is the key visual. The arrow from #4→#1 should be the thickest/brightest. Drop shadows for depth.

---

## 4. Matryoshka Dimensions Visualization

**Filename:** `matryoshka-dimensions.png`
**Used in:** Key Concepts section (Matryoshka explanation)

> Create a diagram on dark background (#0F1117) titled "Matryoshka: Pay Only for the Precision You Need." The concept: a single embedding can be truncated to fewer dimensions — you lose a little quality but save a lot of cost and speed. Show this as three horizontal rows, one per truncation level, each row telling a small story:
>
> **Row 1 — 1024 dims (full resolution)**
> A long, bright teal (#009191) bar stretching the full width. Label: "1024 dims — 100% quality." To the right, a small tag: "The 2 AM partner email — you need every dimension." The bar glows fully, dense with detail.
>
> **Row 2 — 512 dims (half the cost)**
> The same bar but cut in half — the right half fades to dark, the left half stays bright. Label: "512 dims — ~97% quality." Tag: "Daily compliance scan — fast enough, accurate enough." A faint scissors or cut-line icon at the truncation point.
>
> **Row 3 — 256 dims (quarter the cost)**
> The bar cut to a quarter — short and intensely bright. Label: "256 dims — ~92% quality." Tag: "Bulk pre-filter across 10k documents — speed over precision."
>
> Below all three rows, a single callout line: "The most important information is always in the first dimensions" with a small arrow pointing left toward the bright ends of all three bars.
>
> Visual style: the bars should feel like glowing data streams — luminous gradients fading to void on the right, not flat rectangles. The truncation points should feel clean and intentional (a sharp edge, a faint dashed line). Teal (#009191) for the bars, gold (#FEC514) accent on the Row 1 tag to connect it to the partner-panic theme. Subtle depth via drop shadows. Sans-serif font. 800×400px, presentation slide format.

---

## 5. VLM Architecture Analysis Flow

**Filename:** `vlm-analysis-flow.png`
**Used in:** CLIP & VLM section (static backup for the interactive demo)

> Create a left-to-right flow diagram on dark background (#0F1117) showing the Visual Diagram Auditor pipeline — from image upload to semantic search hit. Five stages connected by glowing arrows:
>
> **Stage 1 — Upload:** A thumbnail of a cloud architecture diagram (abstract service boxes and arrows) with a subtle red/orange warning glow around the edges — something in this diagram is about to cause problems. Arrow labeled "Upload" leads to →
>
> **Stage 2 — VLM Analysis:** "Jina VLM" box in teal (#009191) with an eye icon emitting a faint scanning beam. Arrow labeled "Describe" leads to →
>
> **Stage 3 — Text Output:** A terminal-styled text block showing the VLM's description: "The system uses Amazon Rekognition for image classification… this falls under biometric categorization." Arrow labeled "Embed" leads to →
>
> **Stage 4 — Embedding:** "Jina Embeddings v5" box in teal (#009191). The text visually dissolves into a floating vector array (small glowing numbers/dots) — showing the description being converted into a semantic embedding that can be searched. Arrow labeled "Semantic Search" leads to →
>
> **Stage 5 — Search Match:** "Elasticsearch" box in blue (#0B64DD) with a glowing "MATCH FOUND" indicator and result: "EU AI Act Article 5: Prohibited practices…" — the moment the architecture got flagged.
>
> The key insight this diagram communicates: the VLM *describes* the image, the embedding model makes that description *searchable*, and Elasticsearch finds the *regulation that matters*. Use teal (#009191) for Jina components, blue (#0B64DD) for Elastic, warning amber for the flagged diagram thumbnail. Subtle depth with soft glows and drop shadows. Sans-serif font. 1200×400px, presentation slide format.

---

## 6. EIS Architecture — Before/After

**Filename:** `eis-before-after.png`
**Used in:** What Is EIS section

> Create a two-panel comparison diagram on dark background (#0F1117). Sans-serif font. 1000×500px, presentation slide format.
>
> **Left panel — title: "Without EIS"**
> A central orange box labeled "Your App". Around it, a 3×2 grid of 6 muted grey rounded boxes, each with a provider name and a small overhead icon:
> - "OpenAI" with a key icon
> - "Anthropic" with a key icon
> - "Google AI" with a key icon
> - "Jina AI" with a key icon
> - "ELSER" with a server/GPU icon (red-tinted border)
> - "E5" with a server/GPU icon (red-tinted border)
>
> Messy connection lines from each box to the center "Your App" — different line styles, crossing each other. Small scattered icons between the lines: keys, dollar signs, config files. The overall feel should be cluttered and heavy.
> Below: "6 integrations. 2 need ML nodes."
>
> **Right panel — title: "With EIS"**
> A single clean blue (#0B64DD) rounded box in the center labeled "Elastic Inference Service". Below it, a small code badge clearly reading: "service": "elastic"
>
> Radiating out from the EIS box, three labeled rows of small teal (#009191) badges:
> - Row labeled "LLMs": 3 badges (OpenAI, Anthropic, Google)
> - Row labeled "Embeddings": 5 badges (Jina v5, ELSER, E5, OpenAI, Google)
> - Row labeled "Rerankers": 2 badges (Jina v3, Jina v2)
>
> All badges neatly aligned, connected to the central EIS box with clean thin lines. The overall feel should be organized and effortless.
> Below: "One API. LLMs, embeddings, and rerankers."
>
> The contrast between the two panels should be immediately obvious: chaotic overhead on the left, clean simplicity on the right. Dark background with soft ambient glow. Do NOT include Reader or VLM on the right side.

---

## 7. Context Window Visualization

**Filename:** `context-window.png`
**Used in:** Key Concepts section (paired with Context Window definition)

> Create a diagram on dark background (#0F1117) titled "Context Window: You Choose How to Chunk." The concept: a context window is the maximum text a model can read in one pass. A small window forces aggressive chunking. A large window gives you the choice — chunk when it helps, don't when it doesn't. Show three horizontal document strips stacked vertically, each representing the same long document being processed by models with different context windows:
>
> **Row 1 — 512 tokens (ELSER)**
> A long document strip divided into many small chunks (roughly 20 chunks) separated by visible red (#EB6161) cut lines. Each chunk is a short muted grey segment. Label left: "ELSER". Label above: "512 tokens — ~1 paragraph per chunk." A red tag on the right: "Forced chunking — no choice." The cuts should feel like constraints — hard boundaries imposed by the model's limit.
>
> **Row 2 — 8K tokens (typical)**
> The same document, but now only 4–5 chunks separated by amber (#FEC514) cut lines. Chunks are longer, more substantial. Label left: "Typical". Label above: "8K tokens — ~6 pages per chunk." Amber tag: "Some flexibility."
>
> **Row 3 — 32K tokens (Jina v5)**
> The same document as a single unbroken bright teal (#009191) bar — no cuts. It glows with full intensity. Label left: "Jina v5". Label above: "32K tokens — ~25 pages in one pass." A gold (#FEC514) tag: "Chunk when you want to, not because you have to."
>
> Below all three rows, a callout: "Bigger context window = more flexibility. You decide the right chunking strategy for your data." with a subtle arrow pointing down.
>
> Visual style: the document strips should feel like luminous data streams on the dark background. The cut lines in rows 1 and 2 should feel like imposed boundaries — clean but clearly limiting. The unbroken row 3 should feel open and unconstrained by contrast. Teal (#009191) for the full-context bar, muted grey for the chunked bars, red (#EB6161) for 512-token cuts, amber (#FEC514) for 8K cuts. Subtle depth via drop shadows. Sans-serif font. 800×500px, presentation slide format.

---

## 8. LoRA Adapters Visualization

**Filename:** `lora-adapters.png`
**Used in:** Key Concepts section (paired with LoRA Adapters definition)

> Create a diagram on dark background (#0F1117) titled "LoRA Adapters: One Model, Optimized per Task." The concept: a single base model can handle multiple tasks (retrieval, classification, clustering) on its own, but LoRA adapters let you optimize its behavior for each task without deploying separate models. Think of them as lightweight tuning layers you swap at query time.
>
> **Center:** A large teal (#009191) rounded rectangle labeled "jina-embeddings-v5" — the base model. It should feel solid, substantial, like a server or engine block. Label below: "677M parameters — one deployment."
>
> **Radiating out from the base model**, three smaller adapter modules connected by glowing plug-in connectors (like USB or slot connections). Each adapter is labeled with its task and a brief description of how it optimizes the base model:
>
> **Adapter 1 (top-right):** A small blue (#0B64DD) module labeled "retrieval." Tag: "Tuned for finding relevant documents." A subtle search icon.
>
> **Adapter 2 (right):** A small gold (#FEC514) module labeled "classification." Tag: "Tuned for sorting into categories." A subtle category/tag icon.
>
> **Adapter 3 (bottom-right):** A small teal-green (#02BCB7) module labeled "clustering." Tag: "Tuned for grouping similar items." A subtle cluster/graph icon.
>
> **At the bottom**, a single-line callout (not a comparison): "Select the adapter at query time — same model, different optimization. Each adapter adds only ~5M parameters."
>
> The adapter modules should feel lightweight — small, with thin borders and a subtle glow. The plug-in connectors should look physical and satisfying, like clicking a module into a slot. The key visual idea: one solid base with small, swappable specializations. Sans-serif font. Subtle depth via drop shadows and soft glow. 800×500px, presentation slide format.

---

## 9. Listwise vs Pointwise Reranking Diagram

**Filename:** `listwise-vs-pointwise.png`
**Used in:** Rerankers section (replacing the old before/after static image)

> Create a side-by-side comparison diagram on dark background (#0F1117) titled "Pointwise vs Listwise Reranking."
>
> **Left panel — "Pointwise (v2)"**
> Show 5 small processing boxes stacked vertically. Each box contains ONE document paired with the query, producing ONE score. The boxes are independent — no connections between them. Each box is labeled with input (query + doc name) and output (score):
> - Box 1: Query + Art. 5 → 0.74
> - Box 2: Query + Art. 52 → 0.68
> - Box 3: Query + Art. 6 → 0.81
> - Box 4: Query + Art. 26 → 0.72
> - Box 5: Query + Art. 9 → 0.65
>
> Below: "5 separate passes. Each doc scored in isolation."
> The boxes should be muted grey, small, repetitive — visually showing the redundancy.
>
> **Right panel — "Listwise (v3)"**
> Show ONE large processing box. Inside it: the query at top AND all 5 documents together. A single output: a ranked list with reordered scores. The output list:
> 1. Art. 6 — 0.96 (gold highlight)
> 2. Art. 5 — 0.89
> 3. Art. 26 — 0.82
> 4. Art. 9 — 0.85
> 5. Art. 52 — 0.62
>
> Below: "1 pass. All docs compared against each other AND the query."
> The single box should be larger, teal (#009191), feeling unified and efficient.
>
> Key insight this communicates: pointwise asks "is this doc relevant?" 5 separate times. Listwise asks "which of these is MOST relevant?" once. The visual difference should be obvious: 5 small isolated boxes vs 1 big unified box.
>
> Dark background (#0F1117). Teal (#009191) for the listwise box. Gold (#FEC514) for the top result. Muted grey for pointwise boxes. Sans-serif font. 900×500px, presentation slide format.

---

## Usage

After generating each image:

1. Save to `docs/presentation/assets/` using the suggested filename
2. Add to `index.html` in the appropriate section:

```html
<img src="assets/pipeline-architecture.png" alt="Search pipeline architecture" style="width:100%;border-radius:8px;margin-top:1rem">
```

3. Update `export_pptx.py` to include the image on the corresponding slide
