<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0 (initial ratification)

Modified principles: N/A (initial creation)

Added sections:
  - Core Principles (5 principles)
  - Tech Stack Constraints
  - Quality Gates
  - Governance

Removed sections: N/A

Templates reviewed:
  ✅ .specify/templates/plan-template.md
     — Constitution Check section present; gates now defined by this document
  ✅ .specify/templates/spec-template.md
     — No conflicts; mandatory sections (User Scenarios, Requirements, Success Criteria) align with principles
  ✅ .specify/templates/tasks-template.md
     — Parallel-first task structure aligns with Principle V (simplicity); no updates needed
  ✅ specs/001-secure-prompt-box/plan.md
     — Constitution Check table already consistent with these principles

Follow-up TODOs: None — all placeholders resolved
-->

# Hellmet Constitution

## Core Principles

### I. One Feature, Zero Drift

Hellmet does exactly one thing: transform a raw coding intention into a
security-hardened prompt. Every contribution MUST serve this core pipeline
— detection → OWASP mapping → constraint injection → formatted output.

Features that do not directly improve this pipeline (analytics dashboards,
user accounts, history, integrations, export formats) MUST NOT be added
without an explicit decision to expand scope. Any scope expansion requires
a new feature spec and a constitution amendment.

Rationale: one-feature tools succeed by doing one thing exceptionally well.
Scope creep is the primary cause of tool abandonment.

### II. Offline-First Core

The core pipeline — keyword detection, OWASP mapping, constraint injection,
and prompt formatting — MUST execute entirely in the browser without any
network call. Generating a secured prompt MUST work with no internet
connection and no API key configured.

LLM enrichment (Groq or equivalent) is additive and MUST be optional. The
UI MUST degrade gracefully: if the enrichment endpoint is unavailable,
the locally-generated prompt is shown without error.

Rationale: network dependency on the critical path creates latency,
availability risk, and API cost. The core value proposition must be
zero-dependency.

### III. Security Output Integrity

Since Hellmet's product is security guidance, the OWASP constraint library
MUST be accurate, current (OWASP 2025 Top 10), and actionable. Vague,
incorrect, or outdated security constraints are a critical bug — not a
minor defect.

Each OWASP rule entry in `src/data/rules.json` MUST include:
- A specific, actionable constraint (not a generic reminder)
- Reference to the correct OWASP category identifier

The constraint text MUST be reviewed and updated when OWASP releases a
new Top 10 edition.

Rationale: users trust Hellmet to inject correct security guidance into
their prompts. Incorrect guidance directly harms users' codebases.

### IV. Client-Side by Default

Logic that can execute in the browser MUST execute in the browser. A
server-side route MUST only be introduced when client execution is
impossible — specifically when protecting a secret (e.g., API key) that
cannot be exposed to the client bundle.

The single permitted server route is `POST /api/enhance` (Groq enrichment).
Any additional server routes require explicit justification in the feature
plan's Complexity Tracking table.

Rationale: server routes add operational complexity (deployment, cold starts,
error handling, cost). The web client is the correct execution environment
for stateless text processing.

### V. Simplicity First (YAGNI)

No database. No monorepo. No external state management library. No
authentication. No persistent storage.

Every dependency added to the project MUST solve a concrete, current problem
that cannot be addressed with the existing stack. "We might need it later"
is not a valid justification.

Any deviation from this principle (additional dependency, new architectural
layer, third project, repository pattern, etc.) MUST be documented in the
Complexity Tracking table of the feature plan with:
1. The concrete current need
2. The simpler alternative that was considered and rejected (with reason)

Rationale: complexity accumulates invisibly. YAGNI prevents premature
abstraction in a tool designed to stay lean and fast.

## Tech Stack Constraints

These choices are fixed for v1 and MUST NOT be changed without a
constitution amendment:

| Layer | Constraint |
|-------|-----------|
| Framework | Next.js 15+ (App Router). No Pages Router. No alternative framework. |
| Language | TypeScript (strict mode). No plain JavaScript files in `src/`. |
| Styling | Tailwind CSS v4 with CSS-first `@theme` configuration. No CSS-in-JS. |
| LLM provider | Groq SDK (`groq-sdk`). Node runtime only — no Edge runtime for LLM routes. |
| Knowledge base | `src/data/rules.json` static file. No database, no CMS, no remote fetch. |
| Deployment | Vercel. No self-hosted infrastructure in v1. |
| State | React `useState` / `useReducer`. No Redux, Zustand, Jotai, or equivalent. |

## Quality Gates

Every feature plan (plan.md) MUST include a Constitution Check table that
evaluates against the five principles above before implementation begins.

A feature MUST NOT proceed to `/speckit.tasks` if any gate fails without
a documented justification in the Complexity Tracking table.

**Minimum test coverage requirements**:
- All `src/core/` modules (detector, owasp-map, constraints, prompt-builder)
  MUST have unit tests.
- Unit tests MUST cover all 6 domain detection cases and both output formats
  (Claude XML, GPT Markdown).
- Component tests for `Toggles` and `OutputPanel` are SHOULD (required if
  the component has conditional rendering logic).

**Performance gate** (evaluated during smoke testing):
- Core prompt generation MUST complete in < 300ms measured from submit click
  to output render, on a mid-range device with no network activity.

## Governance

This constitution supersedes all other development practices for this
project. In case of conflict between this document and any other guide,
this document takes precedence.

**Amendment procedure**:
1. Open a PR on a feature branch.
2. Update `.specify/memory/constitution.md` with the proposed change.
3. Increment the version following semver:
   - MAJOR: principle removal, principle redefinition, stack constraint change.
   - MINOR: new principle, new section, materially expanded guidance.
   - PATCH: clarification, wording, typo fix.
4. Run consistency propagation: update all templates that reference
   changed principles.
5. Update `LAST_AMENDED_DATE` to the merge date.

**Compliance review**: Every plan.md MUST include a Constitution Check
table. The `/speckit.plan` command enforces this gate automatically.

**Agent context**: `.specify/memory/constitution.md` is the authoritative
source for all AI agent context files (CLAUDE.md, etc.). Run
`.specify/scripts/bash/update-agent-context.sh claude` after any amendment.

**Version**: 1.0.0 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-03-04
