---
description: "Task list for Hellmet — Secure Prompt Box"
---

# Tasks: Hellmet — Secure Prompt Box

**Input**: Design documents from `/specs/001-secure-prompt-box/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Included — required by constitution quality gates for all `src/core/` modules and conditional-logic components.

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Next.js 15 project, install dependencies, configure Tailwind v4 and environment.

- [x] T001 Initialize Next.js 15 project at repo root: `npx create-next-app@latest . --typescript --app --src-dir --import-alias "@/*" --no-eslint` (do NOT select Tailwind during wizard — installed manually in T002)
- [x] T002 [P] Install Tailwind CSS v4 dependencies: `npm install tailwindcss @tailwindcss/postcss postcss`
- [x] T003 [P] Install Groq SDK: `npm install groq-sdk`
- [x] T004 [P] Replace `postcss.config.mjs` with Tailwind v4 config: `export default { plugins: { "@tailwindcss/postcss": {} } }`
- [x] T005 [P] Replace `src/app/globals.css` with Tailwind v4 import and dark cyber `@theme` (tokens: `--color-bg`, `--color-surface`, `--color-accent`, `--color-muted`, `--font-mono`)
- [x] T006 [P] Create directory structure: `src/core/`, `src/components/`, `src/data/`, `tests/unit/`, `tests/component/`
- [x] T007 [P] Create `.env.example` with `GROQ_API_KEY=` placeholder and add `.env.local` to `.gitignore`

**Checkpoint**: `npm run dev` starts without errors on http://localhost:3000

---

## Phase 2: Foundational (Core Engine — Blocking Prerequisite)

**Purpose**: Pure TypeScript modules that power all user stories. No framework dependency. Must be complete before any UI story begins.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T008 Create `src/data/rules.json` — OWASP 2025 rules array with 7 entries (A01, A02, A03, A04, A05, A07, A09), each with fields: `id`, `name`, `constraint` (specific actionable text per constitution Principle III)
- [x] T009 [P] Implement `src/core/owasp-map.ts` — export const `DOMAIN_MAP: Record<DomainKey, OWASPRuleId[]>` mapping all 6 domains (api, auth, upload, database, frontend, crypto) to their OWASP rule IDs per data-model.md
- [x] T010 [P] Implement `src/core/constraints.ts` — export function `getConstraint(id: OWASPRuleId): string` that looks up constraint text from `rules.json`; export `getRules(): OWASPRule[]` for UI consumption
- [x] T011 [P] Implement `src/core/detector.ts` — export function `detect(text: string): Detection` using keyword matching for 11 languages (Python, JavaScript, TypeScript, Node.js, SQL, Go, Rust, PHP, Java, C#, Bash) and 6 domains; returns `{ language: string|null, domain: DomainKey|null, matchedKeywords: string[] }`
- [x] T012 Write unit tests `tests/unit/detector.test.ts` — cover all 6 domain detection cases from spec.md (including multi-domain union case), null detection case, and at least 4 language detection cases
- [x] T013 [P] Write unit tests `tests/unit/owasp-map.test.ts` — verify each domain maps to the correct rule IDs per data-model.md mapping table
- [x] T014 Implement `src/core/prompt-builder.ts` — export function `buildPrompt(intention: string, rules: OWASPRule[]): PromptOutput` returning `{ claude: string, gpt: string }`; Claude format MUST use `<task>`, `<security_constraints>`, `<instructions>` tags; GPT format MUST use `### Tâche`, `### Contraintes de sécurité obligatoires`, `### Instructions` sections
- [x] T015 Write unit tests `tests/unit/prompt-builder.test.ts` — verify Claude output contains required XML tags (SC-004), verify GPT output contains required Markdown sections (SC-005), verify empty rules case produces prompt with no-constraints notice

**Checkpoint**: `npm test` passes all 3 unit test suites. Core engine works independently.

---

## Phase 3: User Story 1 — Transformer une intention en prompt sécurisé (Priority: P1) 🎯 MVP

**Goal**: User types a coding intention, submits, and sees a security-hardened prompt with detection metadata — entirely client-side, < 300ms.

**Independent Test**: Type `"Crée une route d'api pour uploader des images en Node"`, click Run → verify output contains A01 and A04 constraints, detection shows `Node.js · upload`, rules `A01, A04`.

- [x] T016 [P] [US1] Implement `src/app/layout.tsx` — root Next.js layout: dark background (`bg-[--color-bg]`), mono font, full-height body; import `globals.css`
- [x] T017 [US1] Implement `src/components/OutputPanel.tsx` (US1 scope) — receive `output: PromptOutput|null`, `isLoading: boolean`, `detection: Detection|null`, `activeRules: Set<string>`; render: loading skeleton when `isLoading`, placeholder text when no output, readonly `<textarea>` with prompt when output exists; render detection metadata line: `Détection : {language} · {domain}` and `Règles injectées : {A01, A04, …}`; NO copy buttons yet (added in US3)
- [x] T018 [US1] Implement `src/components/SingleBox.tsx` — owns `AppState` via `useReducer`; render: header "Hellmet", intention `<textarea>` (placeholder: "Décris ce que tu veux coder…"), `[→ Run]` submit button (also fires on Ctrl+Enter), Toggles placeholder div, `<OutputPanel />`; on submit: runs `detect()` → `DOMAIN_MAP` → `getConstraint()` → `buildPrompt()` → sets output; shows error if intention is empty
- [x] T019 [US1] Implement `src/app/page.tsx` — renders `<SingleBox />` as a Client Component (`"use client"`)

**Checkpoint**: User Story 1 fully functional. Type intention → prompt generated → metadata shown. `npm run dev` and verify manually against 3 acceptance scenarios from spec.md.

---

## Phase 4: User Story 2 — Forcer des règles OWASP via les toggles (Priority: P2)

**Goal**: User activates OWASP toggles manually; activated rules are added to auto-detected rules without duplicates and persist across submissions.

**Independent Test**: Input `"créer un composant de formulaire"` (auto-detects `frontend` → A03, A05), activate toggle A07 → submit → output contains A03, A05, A07 with no duplicates.

- [x] T020 [P] [US2] Implement `src/components/Toggles.tsx` — render 6 OWASP toggle buttons (A01 Access Control, A02 Crypto, A03 Injection, A04 Insecure Design, A07 Auth, A09 Logging); 3 visual states via CSS classes: `auto` (highlighted, non-interactive indicator), `manual` (highlighted, user-activated), `inactive` (muted); each button uses `role="button"` and `aria-pressed`; call `onChange(id, !currentState)` on click
- [x] T021 [US2] Integrate `<Toggles />` into `src/components/SingleBox.tsx` — add `manualToggles: Set<OWASPRuleId>` to AppState; add `TOGGLE_RULE` action to reducer; pass `activeToggles`, `autoDetected`, and `onChange` props to Toggles; compute effective rule set as union of `autoDetected` + `manualToggles` (dedup) before passing to `buildPrompt()`; if output already exists, regenerate on toggle change
- [x] T022 [US2] Write component test `tests/component/Toggles.test.tsx` — verify: activating a toggle calls `onChange` with correct id; a rule in `autoDetected` has `auto` visual state; a manually activated rule has `manual` state; toggle state is additive (union, no duplicate in effective rules)

**Checkpoint**: User Stories 1 + 2 independently functional. Toggle activation/deactivation updates prompt output.

---

## Phase 5: User Story 3 — Copier le prompt dans le bon format (Priority: P3)

**Goal**: One-click copy to clipboard in Claude XML format or GPT Markdown format, with visual confirmation.

**Independent Test**: Generate a prompt → click "Copy for Claude" → paste into text editor → verify `<task>`, `<security_constraints>`, `<instructions>` tags present. Click "Copy for GPT" → verify `### Tâche` sections present.

- [ ] T023 [P] [US3] Add copy buttons to `src/components/OutputPanel.tsx` — add `[Copy for Claude]` and `[Copy for GPT]` buttons; detect `navigator.clipboard` availability on mount; if unavailable: buttons disabled with `title` tooltip "Clipboard non disponible dans ce contexte"; on click: call `navigator.clipboard.writeText(output.claude)` or `output.gpt`
- [ ] T024 [US3] Add copy success feedback to `src/components/OutputPanel.tsx` — track `copiedTarget: "claude"|"gpt"|null` state; after successful write: set `copiedTarget`, reset to `null` after 2000ms; button label changes to "Copié !" while active; add `aria-live="polite"` region announcing copy confirmation for screen readers
- [ ] T025 [US3] Write component test `tests/component/OutputPanel.test.tsx` — mock `navigator.clipboard.writeText`; verify: clicking "Copy for Claude" writes `output.claude` to clipboard; clicking "Copy for GPT" writes `output.gpt`; "Copié !" feedback appears after copy; buttons disabled when clipboard unavailable

**Checkpoint**: All 3 user stories independently functional. Full acceptance scenario walkthrough passes.

---

## Phase 6: Optional LLM Enrichment (Groq API)

**Goal**: Optional Groq-powered prompt enrichment that enhances the locally-generated prompt. Graceful fallback if unavailable.

- [ ] T026 [P] Implement `src/app/api/enhance/route.ts` — `export const runtime = "nodejs"`; `POST` handler accepts `{ intention: string, rules: string[], basePrompt: string }`; instantiate `new Groq({ apiKey: process.env.GROQ_API_KEY })` at module scope; call `groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [...], max_tokens: 512 })`; return `{ text: string }` on success, `{ error: string }` with status 400/500 on failure
- [ ] T027 [US1] Add "Enhance with AI" button to `src/components/OutputPanel.tsx` — visible only when `output` is set; on click: POST to `/api/enhance`, show loading state on button, update `output.claude` and `output.gpt` with enriched text; on fetch error: keep existing local output, show brief toast "Enrichissement indisponible"

**Checkpoint**: LLM enrichment works when `GROQ_API_KEY` is set. Core feature unaffected when key is absent or endpoint fails.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, performance validation, deployment verification.

- [ ] T028 [P] Accessibility audit — verify keyboard navigation through all interactive elements (Tab order: textarea → toggles → submit → copy buttons); verify all toggle buttons have `aria-pressed` states; verify `aria-live` copy announcement works with screen reader (or jest-axe check)
- [ ] T029 [P] Run `npm run build` (Next.js production build) and fix any TypeScript errors or build warnings
- [ ] T030 Performance gate validation — measure core prompt generation time from submit click to `OutputPanel` render using browser DevTools; MUST be < 300ms (SC-001) on a mid-range device; if failing, profile and optimize detector or prompt-builder
- [ ] T031 [P] Configure Vercel deployment — import project in Vercel dashboard, set `GROQ_API_KEY` environment variable, deploy from `001-secure-prompt-box` branch, smoke-test all 3 user stories in production
- [ ] T032 Quickstart.md validation — follow `specs/001-secure-prompt-box/quickstart.md` steps on a fresh checkout and verify all steps complete without errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 + Phase 3 completion (toggles integrate into SingleBox)
- **User Story 3 (Phase 5)**: Depends on Phase 3 completion (extends OutputPanel); can run in parallel with Phase 4
- **LLM Enrichment (Phase 6)**: Depends on Phase 3 (extends OutputPanel and adds API route); can run in parallel with Phase 4/5
- **Polish (Phase 7)**: Depends on Phases 3, 4, 5 completion

### User Story Dependencies

- **US1 (P1)**: Requires Foundational (Phase 2) — no dependency on other stories
- **US2 (P2)**: Requires Phase 3 (integrates into SingleBox built in US1)
- **US3 (P3)**: Requires Phase 3 (extends OutputPanel built in US1) — independent of US2

### Within Each Phase

- Models/types → services → UI components → integration
- Unit tests (T012, T013, T015) written before or alongside their target module
- Component tests (T022, T025) written alongside or immediately after component

### Parallel Opportunities

- T002 + T003: npm installs (run in parallel in terminal)
- T004 + T005 + T006 + T007: config files (all parallel after T001)
- T009 + T010 + T011: core modules (all parallel after T008)
- T012 + T013: unit tests (parallel)
- T016 + T017: layout and OutputPanel v1 (parallel)
- T023 + T024: copy buttons (T024 extends T023 but different logic, sequential)
- T026 + T028 + T029 + T031: can all run in parallel in Phase 6/7

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — core engine + tests
3. Complete Phase 3: User Story 1 — full intention → prompt flow
4. **STOP and VALIDATE**: Test manually against all 3 acceptance scenarios from spec.md
5. Deploy preview to Vercel if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 → **MVP**: intention → secured prompt (deploy-ready)
3. Phase 4 → Add OWASP toggles (demo to stakeholders)
4. Phase 5 → Add copy buttons (complete core feature)
5. Phase 6 → Add Groq enrichment (optional enhancement)
6. Phase 7 → Polish + deploy to production

---

## Notes

- `[P]` tasks operate on different files — safe to parallelize
- `[US1/US2/US3]` labels map tasks to their user story for traceability
- Each user story phase produces an independently testable increment
- Do NOT use `export const runtime = "edge"` in `app/api/enhance/route.ts` — Groq SDK requires Node runtime
- Tailwind v4: use `outline-hidden` not `outline-none`, explicit ring/border values not defaults (see research.md)
- Clipboard API requires HTTPS in production — test on Vercel preview URL, not localhost if Chrome blocks it
