# Funding Applicator

**Standalone application.** Generate pre-filled, plain-language application templates for funding sources. Translates complex grant language into accessible instructions for people with learning disabilities.

---

## Purpose

- **Input:** Funding Finder report (JSON) from “Download report (JSON)” on [Funding Finder](https://github.com/Jennaleighwilder/funding-finder).
- **Output:** Per-source application wizards with translated requirements, pre-filled fields from your profile, templates with [FILL THIS IN] blanks, good/bad examples, word counts, and export (PDF, Word, copy).

## Run locally

1. Open this folder in a browser or use a local server:
   - **Option A:** Double-click `index.html` or drag it into a browser.
   - **Option B:** From this folder run `python3 -m http.server 8080` and go to `http://localhost:8080`.
2. Upload a Funding Finder JSON report, or use **sample-report.json** to try it without Funding Finder.
3. Click “Let’s go!” → choose a source → “Generate Application Template” → follow the wizard.

## Features

- **Upload page** – Drag/drop or choose a Funding Finder report JSON; optional profile (business name, location, description) for pre-fill.
- **Source selector** – Cards with name, amount, deadline, difficulty (Easiest / Medium / Harder). Sort by Easiest first, Highest amount, or Closest deadline. “Generate Application Template” per source.
- **Template generator (wizard)** – Per source:
  - **Translate requirements** – “What they asked” (grant-speak) → “What they mean” (plain language).
  - **Pre-fill from profile** – Business name, location, project description used where relevant.
  - **Templates** – Plain-language question, “Why they’re asking,” template with [FILL THIS IN], good/bad examples, word count.
  - **Step-by-step** – One section at a time, progress bar, Save, Next/Back, “Take a break” (saves progress).
- **Document builder** – Review screen: checklist (✓ complete / ⚠ needs work), attachment list, Download as PDF, Download as Word, Copy all text, link to application portal.
- **Jargon dictionary** – Hover or focus grant-speak terms (e.g. “deliverables,” “sustainability”) to see plain-English definitions.
- **Accessibility** – Font size (small/medium/large), dyslexia-friendly font toggle, high contrast, “Read aloud” (text-to-speech), large buttons (60px min), clear labels.

## Design (Southwestern)

- **Colors:** Fuchsia, Neon Teal, Desert Blue, Salmon, Terracotta, Mustard; backgrounds Oatmeal, Sand, Cream; text Dark Brown / Medium Brown.
- **Fonts:** Poppins (headings, buttons), Inter (body).

## Files

- `index.html` – Main app shell and views (upload, sources, wizard, review).
- `css/app.css` – Southwestern theme and layout.
- `js/app.js` – State, upload, source list, wizard, review, export.
- `js/engine.js` – Template generation, language simplification, sections from requirements.
- `js/dictionary.js` – Jargon terms and popup definitions.
- `sample-report.json` – Example Funding Finder report for testing.

## Report JSON format

Same as Funding Finder export: `reportType: "funding_finder"`, `forSisterSite: true`, `summary`, `opportunities[]` with `source_name`, `provider_name`, `application_url`, `min_amount`, `max_amount`, `deadline_type`, `requirements_text`, `match_score`, `match_reasons`, `eligibility_gaps`, `competitive_advantages`.

---

This is **not** a companion site to Funding Finder — it is its own engine: a template builder and language translator.
