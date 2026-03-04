# Implementation Plan: Hellmet — Secure Prompt Box

**Branch**: `001-secure-prompt-box` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-secure-prompt-box/spec.md`

---

## Summary

Hellmet is a single-page web application that transforms a raw coding intention into a security-hardened prompt ready to paste into any LLM. The core pipeline runs entirely client-side: keyword-based detection identifies the programming language and domain, maps them to OWASP 2025 rules, injects constraint text, and formats the output in two LLM-optimized variants (Claude XML, GPT Markdown). An optional Groq LLM API route can enrich the generated prompt server-side with sub-500ms latency.

---

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router), Tailwind CSS v4, Groq SDK (`groq-sdk`)
**Storage**: `rules.json` — static JSON file bundled with the app (no database)
**Testing**: Jest + React Testing Library
**Target Platform**: Web — modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+), deployed on Vercel
**Project Type**: web-application (single page, greenfield)
**Performance Goals**: Core prompt generation < 300ms (client-side); optional LLM enrichment < 500ms TTFT
**Constraints**: Core feature works offline (no API dependency); client-side Clipboard API required for copy buttons (graceful degradation if unavailable)
**Scale/Scope**: Single-page MVP, one primary interface, no user accounts or persistence

---

## Constitution Check

*GATE: evaluated against `.specify/memory/constitution.md` v1.0.0*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. One Feature, Zero Drift | Feature serves core pipeline only | PASS | Detection → mapping → injection → output. No scope expansion. |
| II. Offline-First Core | Core works without network | PASS | All detection and prompt building run client-side (FR-006). LLM enrichment is additive (Phase C). |
| III. Security Output Integrity | OWASP constraints accurate and current | PASS | rules.json targets OWASP 2025 Top 10. Constraint text is specific and actionable. |
| IV. Client-Side by Default | Server route justified | PASS | Single route `/api/enhance` exists solely to protect `GROQ_API_KEY`. |
| V. Simplicity First | No unjustified complexity | PASS | No DB, no monorepo, no state lib, no auth. Complexity Tracking table empty. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-secure-prompt-box/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — technical decisions
├── data-model.md        # Phase 1 — entities and state
├── quickstart.md        # Phase 1 — dev setup guide
├── contracts/
│   ├── api.md           # POST /api/enhance contract
│   └── ui.md            # Component contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx             # Root layout — dark background, font
│   ├── page.tsx               # Renders <SingleBox />
│   ├── globals.css            # Tailwind v4 + @theme dark config
│   └── api/
│       └── enhance/
│           └── route.ts       # POST — optional Groq LLM enrichment (Node runtime)
├── components/
│   ├── SingleBox.tsx          # Root component, owns AppState via useReducer
│   ├── Toggles.tsx            # OWASP rule toggle buttons
│   └── OutputPanel.tsx        # Prompt display + copy buttons + detection metadata
├── core/
│   ├── detector.ts            # Keyword detection → { language, domain }
│   ├── owasp-map.ts           # DomainKey → OWASPRuleId[]
│   ├── constraints.ts         # OWASPRuleId → constraint text
│   └── prompt-builder.ts      # ActiveRuleSet + intention → { claude, gpt }
└── data/
    └── rules.json             # OWASP 2025 rule definitions (id, name, constraint)

tests/
├── unit/
│   ├── detector.test.ts
│   ├── owasp-map.test.ts
│   └── prompt-builder.test.ts
└── component/
    ├── Toggles.test.tsx
    └── OutputPanel.test.tsx
```

**Structure Decision**: Single Next.js 15 project at repo root. All detection/mapping/prompt logic lives in `src/core/` as pure TypeScript functions (no framework dependency) — fully unit-testable. UI components in `src/components/` are Client Components. The API route is the only Server Component boundary.

---

## Implementation Phases

### Phase A — Core Engine (client-side, no UI)

Goal: working detection + prompt generation pipeline, testable in isolation.

1. Create `src/data/rules.json` with all 7 OWASP rules (A01–A09, the 6 mapped ones).
2. Implement `src/core/detector.ts` — keyword matching for 11 languages and 6 domains.
3. Implement `src/core/owasp-map.ts` — domain-to-rules mapping constant.
4. Implement `src/core/constraints.ts` — rule-to-constraint-text lookup.
5. Implement `src/core/prompt-builder.ts` — assembles Claude XML and GPT Markdown.
6. Write unit tests for all 4 core modules (`tests/unit/`).

**Acceptance**: All 6 domain detection examples from spec pass. Prompt output matches expected XML/Markdown structure.

---

### Phase B — UI Shell

Goal: functional single-page interface, wired to the core engine.

1. Configure Next.js 15 + Tailwind v4 (dark theme, mono font).
2. Implement `src/components/SingleBox.tsx` — textarea + submit button + AppState.
3. Implement `src/components/Toggles.tsx` — 6 OWASP toggle buttons with 3 visual states.
4. Implement `src/components/OutputPanel.tsx` — read-only output + copy buttons + detection metadata.
5. Wire `src/app/page.tsx` to render `<SingleBox />`.

**Acceptance**: User can type an intention, submit, see the generated prompt and detection metadata, toggle OWASP rules, and copy either format.

---

### Phase C — Optional LLM Enrichment

Goal: Groq API route for enhanced prompt generation (does not block core feature).

1. Create `src/app/api/enhance/route.ts` using Groq SDK (Node runtime).
2. Add environment variable `GROQ_API_KEY` to `.env.local` and `.env.example`.
3. Add "Enhance with AI" button to `OutputPanel` that calls `/api/enhance` and updates output.
4. Graceful fallback: if API call fails, keep the locally-generated prompt.

**Acceptance**: LLM enrichment returns enriched prompt in < 500ms on Groq; UI falls back to local prompt on error.

---

### Phase D — Deploy

1. Configure Vercel project, set `GROQ_API_KEY` environment variable.
2. Verify production build (`next build`).
3. Deploy and smoke-test all acceptance scenarios from spec.

---

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Groq API unavailable | Core feature fully offline — LLM enrichment is additive only |
| Clipboard API blocked (HTTPS required) | Detect availability on mount, disable copy buttons with explanatory message |
| Keyword detection misses multi-domain inputs | Union all matching domains; spec and tests cover this case explicitly |
| Tailwind v4 breaking change (ring/shadow defaults) | Documented in research.md; use explicit values in components, not defaults |
