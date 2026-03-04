# Research: Hellmet — Secure Prompt Box

**Phase**: 0 — Outline & Research
**Date**: 2026-03-04
**Branch**: `001-secure-prompt-box`

---

## Decision 1: Prompt Engine — Groq SDK vs Fireworks AI

**Decision**: Groq SDK (`groq-sdk`) with `llama-3.3-70b-versatile` as primary model.

**Rationale**:
- Groq LPU hardware delivers ~100–300ms TTFT for short completions, well within the < 500ms target.
- `groq-sdk` is a first-party npm package with full TypeScript support, straightforward to integrate in Next.js 15 API routes.
- Fireworks AI offers similar latency but requires more setup (custom base URL, less documented Next.js integration). Groq is the simpler choice for a one-feature MVP.

**Integration pattern**:
```ts
// app/api/enhance/route.ts
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 512,
  });
  return Response.json({ text: completion.choices[0]?.message?.content ?? "" });
}
```

**Runtime**: Node runtime only (not Edge) — `groq-sdk` uses Node.js-specific internals (`http`, `https`, `stream`) incompatible with the Vercel Edge runtime.

**Alternatives considered**:
- Fireworks AI: rejected — more boilerplate, less documented, no first-party TypeScript SDK as mature as Groq's.
- OpenAI-compatible endpoint via `openai` SDK: rejected — adds a dependency for a provider we don't control; Groq's own SDK is simpler.

---

## Decision 2: Keyword Detection Strategy

**Decision**: Pure client-side keyword matching using a static `rules.json` file. No external NLP in v1.

**Rationale**:
- Sub-300ms target for core flow rules out any network call.
- Keyword matching covers all 6 required domains (api, auth, upload, database, frontend, crypto) with high precision on typical developer inputs.
- The matching logic is transparent, easy to extend (add keywords to `rules.json`), and testable in isolation.

**Detection algorithm**:
```
Input text → lowercase → split into tokens → match against keyword sets per domain/language
→ collect all matching domains → map to OWASP rules
```

Multi-domain input (e.g. "route d'auth avec upload") triggers union of all matched domain rules.

**Alternatives considered**:
- NLP/ML model (e.g., local TensorFlow.js classifier): rejected — overkill for MVP, adds bundle size and complexity.
- Groq LLM for detection: rejected — adds latency and API dependency to the core flow; reserved for optional "enhance" mode in v2.

---

## Decision 3: Tailwind CSS v4 Setup

**Decision**: CSS-first configuration via `@import "tailwindcss"` + `@theme` blocks. No `tailwind.config.ts`.

**Installation**:
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

**`postcss.config.mjs`**:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

**`app/globals.css`**:
```css
@import "tailwindcss";

@theme {
  --color-bg: oklch(0.08 0 0);         /* near-black */
  --color-surface: oklch(0.13 0 0);    /* dark surface */
  --color-accent: oklch(0.72 0.17 145); /* cyber green */
  --color-muted: oklch(0.45 0 0);      /* muted text */
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}
```

**Key v3→v4 breaking changes to note**:
- Border color default: `gray-200` → `currentColor`
- Ring width default: `3px` → `1px`
- Use `outline-hidden` instead of `outline-none`

---

## Decision 4: Next.js 15 App Router Project Structure

**Decision**: Single Next.js 15 project at repo root. No monorepo, no separate backend.

**Rationale**: One-feature tool. The only "backend" needed is a single optional API route (`/api/enhance`) for Groq calls. Everything else (detection, mapping, prompt building) runs client-side or as pure TypeScript modules usable in both contexts.

**Key Next.js 15 considerations**:
- API routes in `app/api/*/route.ts` use the Web Request/Response API natively.
- Server Components for layout, Client Components for interactive UI (SingleBox, Toggles, OutputPanel).
- `GROQ_API_KEY` is server-only — never exposed to the client bundle.

---

## Decision 5: State Management

**Decision**: React `useState` + `useReducer` for local component state. No external state library.

**Rationale**: All state is local to the single-page UI (intention text, detection result, active toggles, generated output). No server-side state persistence needed (v1 has no user accounts or history).

**State shape**:
```ts
type AppState = {
  intention: string;
  detection: { language: string | null; domain: string | null } | null;
  activeRules: Set<string>; // e.g., {"A01", "A04"}
  output: { claude: string; gpt: string } | null;
  isLoading: boolean;
};
```

---

## Summary: All NEEDS CLARIFICATION Resolved

| Topic | Resolution |
|-------|-----------|
| Prompt engine | Groq SDK, Node runtime, llama-3.3-70b-versatile |
| Detection strategy | Client-side keyword matching, rules.json |
| Styling setup | Tailwind v4, CSS-first, dark theme via `@theme` |
| Project structure | Single Next.js 15 app at repo root |
| State management | Local React state, no external library |
