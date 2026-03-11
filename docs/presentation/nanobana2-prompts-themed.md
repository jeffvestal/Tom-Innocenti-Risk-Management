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

> Create a side-by-side comparison diagram on dark background (#0F1117) showing reranking as a dramatic before/after transformation. Left side labeled "Before: what the first search returned" — 5 result bars in a ranked list, dim and uncertain, bars in muted grey tones with slight visual noise/static, relevance scores 0.82, 0.79, 0.77, 0.75, 0.71 in faded text. Right side labeled "After: what the partner actually needed" — the same 5 bars reordered, now clean and glowing with confidence: result #4 moved to position 1 (highlighted with a gold #FEC514 spotlight effect and labeled "Most Relevant"), result #1 moved to position 2, etc. Between left and right, curved movement arrows rendered as light trails — teal (#009191) streaks showing each result sliding to its new position. The right panel feels resolved and authoritative; the left panel feels like guesswork. Teal (#009191) accent line at top, subtle depth via drop shadows. Sans-serif font. 900x500px, presentation slide format.

---

## 4. Matryoshka Dimensions Visualization

**Filename:** `matryoshka-dimensions.png`
**Used in:** Key Concepts section (Matryoshka explanation)

> Create a visualization of Matryoshka Representation Learning on dark background (#0F1117) that makes the nesting-doll metaphor feel tangible and elegant. Show 3 concentric translucent shells — the outermost large and faintly glowing teal (#009191), each inner shell brighter and more concentrated, like layers of compressed meaning. Next to or below the shells, show 3 horizontal energy bars representing truncation levels: a full 1024-dim bar (glowing teal gradient, labeled "1024 dims — 100% quality" in an illuminated badge), a 512-dim bar (same gradient but shorter, labeled "512 dims — ~97% quality"), and a 256-dim bar (shortest, brightest core, labeled "256 dims — ~92% quality"). Each shorter bar retains the brightest left portion, visually reinforcing that the most important information is front-loaded. The bars should have a glowing energy-trail feel — not flat rectangles, but luminous data streams fading to dark on the right. Subtle depth via soft shadows and radial glow behind the shells. Sans-serif font. 800x400px, presentation slide format.

---

## 5. VLM Architecture Analysis Flow

**Filename:** `vlm-analysis-flow.png`
**Used in:** CLIP & VLM section (static backup for the interactive demo)

> Create a diagram on dark background (#0F1117) showing the Visual Diagram Auditor flow — the moment your architecture diagram gets flagged for compliance issues. Left: a thumbnail of a cloud architecture diagram (abstract service boxes and arrows) with a subtle red/orange warning glow around the edges — something in this diagram is about to cause problems. A glowing arrow labeled "Upload" points to center: "Jina VLM" box in teal (#009191) with an eye icon emitting a faint scanning beam over the diagram. A glowing arrow labeled "Analysis" points to right: a text block styled like a streaming terminal output showing "The system uses Amazon Rekognition for image classification… this falls under biometric categorization." Below that, another arrow labeled "Auto-search" points to an "Elasticsearch" box in blue (#0B64DD) with a glowing "MATCH FOUND" indicator and results: "EU AI Act Article 5: Prohibited practices…" — the moment the architecture got flagged. Use teal (#009191) for Jina components, blue (#0B64DD) for Elastic, and a touch of warning amber for the flagged diagram. Subtle depth with soft glows and drop shadows. Sans-serif font. 1000x400px, presentation slide format.

---

## 6. EIS Architecture — Before/After

**Filename:** `eis-before-after.png`
**Used in:** What Is EIS section

> Create a two-panel comparison diagram on dark background (#0F1117) showing the dramatic before/after of Elastic Inference Service. Left panel labeled "Before EIS (what the SE had at 2am)" — a stressed, overloaded aesthetic: tangled connection lines between ML Nodes (GPU icons with faint heat glow), scaling arrows pointing in conflicting directions, model deployment config files stacked haphazardly, monitoring dashboards with warning indicators, a small clock showing 2:00 AM. The whole left panel should feel heavy and suffocating — muted grey tones, visual noise, slight chaos. Right panel labeled "With EIS (what they had by morning)" — zen-like simplicity: a single clean API call box with a soft blue (#0B64DD) glow pointing to "Elastic Cloud" which handles everything, open space, a coffee cup icon with a wisp of steam. The right panel breathes — clean teal (#009191) and blue (#0B64DD) accents, generous whitespace, calm confidence. The contrast should be almost comedic in its severity. Subtle depth via drop shadows and soft ambient glow. Sans-serif font. 1000x500px, presentation slide format.

---

## Usage

After generating each image:

1. Save to `docs/presentation/assets/` using the suggested filename
2. Add to `index.html` in the appropriate section:

```html
<img src="assets/pipeline-architecture.png" alt="Search pipeline architecture" style="width:100%;border-radius:8px;margin-top:1rem">
```

3. Update `export_pptx.py` to include the image on the corresponding slide
