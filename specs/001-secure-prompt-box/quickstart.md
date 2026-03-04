# Quickstart: Hellmet — Secure Prompt Box

**Date**: 2026-03-04

---

## Prerequisites

- Node.js 20+
- A Groq API key (free tier available at console.groq.com) — optional for core feature

---

## Initial Setup

```bash
# 1. Init Next.js 15 project
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint

# 2. Install Tailwind v4 + Groq SDK
npm install tailwindcss @tailwindcss/postcss postcss groq-sdk

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local: set GROQ_API_KEY=gsk_...
```

**.env.example**:
```
GROQ_API_KEY=
```

---

## Tailwind v4 Configuration

Replace the generated `postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

Replace `src/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-bg: oklch(0.08 0 0);
  --color-surface: oklch(0.13 0 0);
  --color-accent: oklch(0.72 0.17 145);
  --color-muted: oklch(0.45 0 0);
  --font-mono: "JetBrains Mono", monospace;
}
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx             # Root layout, dark background
│   ├── page.tsx               # Renders <SingleBox />
│   ├── globals.css            # Tailwind v4 + theme
│   └── api/
│       └── enhance/
│           └── route.ts       # Optional Groq LLM enrichment
├── components/
│   ├── SingleBox.tsx          # Root interactive component (owns AppState)
│   ├── Toggles.tsx            # OWASP rule toggles
│   └── OutputPanel.tsx        # Prompt display + copy buttons
├── core/
│   ├── detector.ts            # Language + domain keyword detection
│   ├── owasp-map.ts           # Domain → OWASP rule mapping
│   ├── constraints.ts         # OWASP constraint text library
│   └── prompt-builder.ts      # Assembles Claude XML + GPT Markdown output
└── data/
    └── rules.json             # OWASP 2025 rule definitions
```

---

## Running Locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Running Tests

```bash
npm test
# Unit tests: src/core/*.test.ts (detector, owasp-map, prompt-builder)
# Component tests: src/components/*.test.tsx
```

---

## Deploying to Vercel

```bash
# 1. Push branch to GitHub
git push origin 001-secure-prompt-box

# 2. Import project in Vercel dashboard
# 3. Set environment variable: GROQ_API_KEY
# 4. Deploy — zero config needed for Next.js 15
```

---

## Key Decisions (see research.md for full rationale)

| Decision | Choice |
|----------|--------|
| LLM provider | Groq SDK (`groq-sdk`), Node runtime |
| Detection | Client-side keyword matching, `rules.json` |
| Styling | Tailwind CSS v4, CSS-first config, dark theme |
| State | React `useReducer`, no external state library |
| Deployment | Vercel (zero-config Next.js) |
