# Project TODO — Innocenti Risk Management Enablement Kit

> **Last updated:** 2026-03-17
> **Status:** Core demo (UI + notebooks + presentation) is functional. Presentation themed version is polished with generated images, TL;DR slides, and 13" screen optimization. Standard version needs parity updates.

---

## Current State

### What's Done
- [x] Python notebooks (ingest, index, rerank) — complete with test coverage
- [x] Next.js UI — Search, Agent Chat, Data Lab — all three modes working
- [x] Agent Builder integration with SSE streaming, follow-up pills, VLM handoff
- [x] VLM pipeline with cold-start retry and warmup endpoint
- [x] Comprehensive test suite: 46 notebook tests, 123 UI unit tests, 25 E2E tests
- [x] Themed presentation (`index.html`) — 29 sections, TL;DR briefing, lightbox/card-focus, 13" optimized
- [x] All 6 Nano Banana 2 diagram images generated and wired into themed HTML + PPTX
- [x] PPTX export for themed version with conditional image slides
- [x] Project bootstrap skill (`.cursor/skills/innocenti-project-bootstrap/SKILL.md`)
- [x] Cursor rule (`.cursor/rules/ui-demo.md`) with full project context

### What's Not Done
See sections below, ordered by priority.

---

## Priority 1 — Standard Presentation Parity

The standard version (`index-standard.html`, `export_pptx_standard.py`) has not been updated with:

- [ ] **Add generated images to `index-standard.html`** — All 6 diagram PNGs exist in `assets/` but aren't referenced in the standard HTML. Should mirror the themed version's `<img>` placements.
- [ ] **Add image slides to `export_pptx_standard.py`** — The themed `export_pptx.py` has 4 conditional image slides (pipeline, key concepts, reranker, VLM, EIS). Port them to the standard exporter.
- [ ] **Update standard NB2 prompts if needed** — `nanobana2-prompts-standard.md` may still have the original (less specific) prompt wording. Compare with themed prompts and update if the visual descriptions should match (the images are shared).
- [ ] **Section splits for 13" screens** — The themed version splits 8 dense sections into sub-slides (17→29 total). The standard version likely still has 17 monolithic sections. Evaluate whether to apply the same splits.
- [ ] **Lightbox / card-focus overlays** — These presenter-mode features exist only in themed. Port to standard if presenting from standard version is a use case.

## Priority 2 — Presentation Content

- [ ] **Scenario-intro callouts audit** — The themed `index.html` has 17 `.scenario-intro` callouts. Verify each one reads naturally with the "fictional customer" framing (was changed from "you" to "they").
- [ ] **Speaker notes** — Neither HTML version has speaker notes. Consider adding `data-notes` attributes or a separate notes document for the ~30 min talk track.
- [ ] **PPTX speaker notes** — The `export_pptx.py` scripts could add `notes_slide.text_frame` content for each slide to guide the presenter.
- [ ] **Test PPTX export** — Run both `export_pptx.py` and `export_pptx_standard.py` end-to-end, open in PowerPoint/Keynote, verify image placement and text rendering.

## Priority 3 — UI Polish

- [ ] **Data Lab visual refresh** — The Data Lab tab works but could benefit from the same level of polish as Search and Agent modes.
- [ ] **Mobile responsiveness** — UI is designed for desktop demo. Basic mobile layout hasn't been validated.
- [ ] **Error boundary** — No React error boundary wrapping the main page. A crash in one mode (e.g., Agent) takes down the whole app.
- [ ] **Accessibility audit** — No ARIA labels on mode toggle, language toggle, or interactive elements. Screen reader support is minimal.

## Priority 4 — Testing & CI

- [ ] **CI for UI tests** — `.github/workflows/test-notebooks.yml` exists for notebook tests but there's no CI workflow for UI unit or E2E tests.
- [ ] **Integration test refresh** — Notebook integration tests (`test_notebooks_integration.py`) run against real services. Verify they still pass with current Elastic Cloud/Jina API state.
- [ ] **Presentation tests** — No tests for PPTX export scripts. A smoke test that runs both exporters and verifies the output file exists would catch import/path errors.

## Priority 5 — Documentation & Cleanup

- [ ] **Update `.cursor/rules/ui-demo.md` Current Status section** — The rule file asks for a "Current Status" section at the top, but none has been added yet.
- [ ] **README presentation section** — `README.md` doesn't mention the `docs/presentation/` directory at all. Add a brief section pointing to the HTML presentation and PPTX export.
- [ ] **Clean up `package-lock.json`** — Minor `fsevents` metadata change was committed; verify `npm ci` runs clean.

---

## Environment Quick Start

```bash
# Clone and set up
git clone <repo-url> && cd Tom-Innocenti-Risk-Management

# UI
cd ui
npm install
cp .env.local.example .env.local   # fill in credentials
npm run setup                       # create index + load data
npm run setup:agent                 # provision agent + esql tool
npm run dev                         # http://localhost:3000

# Notebooks
pip install -r requirements.txt
# Open notebooks/01_ingest.ipynb in Jupyter

# Presentation
open docs/presentation/index.html   # themed version in browser
# or
cd docs/presentation && pip3 install python-pptx Pillow && python3 export_pptx.py
```

## Required Credentials (in `ui/.env.local`)

| Variable | Required | Source |
|----------|----------|--------|
| `ELASTICSEARCH_URL` | Yes* | Elastic Cloud / Serverless endpoint |
| `ELASTIC_API_KEY` | Yes | Elastic Cloud console |
| `JINA_API_KEY` | Yes | https://jina.ai/ |
| `AGENT_CONNECTOR_ID` | For Agent mode | Kibana → Connectors (recommend `OpenAI-GPT-4-1-Mini`) |

*Or `ELASTIC_CLOUD_ID` for classic Cloud deployments.
