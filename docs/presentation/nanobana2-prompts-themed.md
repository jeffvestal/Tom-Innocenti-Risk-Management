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
> **Left panel — "DIY: manage it all yourself"**
> Show 6 separate provider boxes arranged around a central "Your App" box, each requiring its own setup and ongoing maintenance:
>
> | Provider | What you manage |
> |----------|----------------|
> | OpenAI | API key, billing account, rate limits |
> | Anthropic | API key, billing account, usage caps |
> | Google AI | Service account JSON, project config |
> | Jina AI | API key, separate billing |
> | ELSER | Self-hosted ML node, GPU provisioning, scaling |
> | E5 | Self-hosted ML node, model deployment YAML |
>
> Each box in muted grey with connection lines to "Your App." Scattered around the lines: small icons for API keys, billing invoices, config files, monitoring dashboards — the overhead of maintaining 6 separate integrations and 2 self-hosted models. The panel should feel heavy and cluttered — not broken, just exhausting. A lot of work to set up, a lot of work to maintain, and every new model means doing it all again.
>
> **Right panel — "With EIS: one API, every model"**
> A single clean blue (#0B64DD) "Elastic Inference Service" box at center. Radiating out from it in a neat ring: the same 6 provider names (OpenAI, Anthropic, Google, Jina, ELSER, E5) as small, clean teal (#009191) badges — already connected, already configured. No separate API keys, no self-hosted nodes, no billing chaos. A single code snippet floating nearby: `"service": "elastic"`. Below the ring, a subtle "+1" badge with a dotted outline and the text "New model added? You get it automatically." — reinforcing that when Elastic adds a new provider, it just appears.
>
> The contrast: exhausting maintenance on the left, effortless access on the right. Subtle depth via drop shadows and soft ambient glow.

---

## Usage

After generating each image:

1. Save to `docs/presentation/assets/` using the suggested filename
2. Add to `index.html` in the appropriate section:

```html
<img src="assets/pipeline-architecture.png" alt="Search pipeline architecture" style="width:100%;border-radius:8px;margin-top:1rem">
```

3. Update `export_pptx.py` to include the image on the corresponding slide
