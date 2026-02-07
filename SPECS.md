# Funding Finder – How to Apply | Product specs

*(Add your full specs here. This file is the single source of truth for the sister site.)*

---

## Vision

Sister site to Funding Finder. User uploads/loads their **Funding Finder report (JSON)** and gets:

- **How to apply** – Step-by-step instructions per opportunity.
- **Where to apply** – Clear link and URL for each program.
- **Templates** – Simple fill-in templates for applications (e.g. project description, budget, narrative).
- **Plain language** – Jargon-free, short sentences, clear headings.
- **Accessibility** – Designed for people with learning disabilities (readable, predictable layout, optional read-aloud, etc.).

---

## Input

- **Funding Finder report JSON** (from “Download report (JSON)” on Funding Finder).
- Optional: future API or signed link from Funding Finder.

---

## Core flows (to spec in detail)

1. **Load report** – Upload/paste JSON or drag-and-drop file → parse and show list of opportunities.
2. **Per-opportunity guide** – One page (or section) per opportunity: what it is, who offers it, amount/deadline, where to apply (link), what you need (from `requirements_text`), step-by-step how to apply.
3. **Templates** – Reusable templates (e.g. “Project description”, “Budget summary”, “About you”) that user can fill and reuse across applications.
4. **“Dumbing down” hard stuff** – Simplify legal/formal language from requirements into short, clear bullets or sentences.

---

## Accessibility requirements (to spec in detail)

- Plain language; avoid jargon or explain it.
- Short sentences and paragraphs.
- Clear headings and one main idea per section.
- Readable font size and contrast.
- Optional: read-aloud or text-to-speech.
- Predictable navigation and buttons.
- *(Add any WCAG or other standards you want to meet.)*

---

## Tech / structure (to decide)

- Static site (HTML/JS), or framework (React/Vue/etc.).
- How to store “my report” (session only, optional account later).
- Whether templates are client-only or saved to a backend.

---

*Replace this placeholder with your full specs as you get them.*
