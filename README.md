# Hellmet

**A secure prompt builder for developers working with LLMs.**

hellmet takes a plain-language coding intention and transforms it into a structured, security-hardened prompt, automatically injecting the relevant OWASP Top 10 constraints for the detected technical domain.

---

## Contents

- [Why OWASP at design time](#why-owasp-at-design-time)
- [How it works](#how-it-works)
- [Examples](#examples)
- [Features](#features)
- [Installation](#installation)
- [Running tests](#running-tests)
- [Lire en français](README.fr.md)

---

## Why OWASP at design time

Security vulnerabilities are significantly cheaper to fix when addressed at the design stage. The OWASP Top 10 is the industry-standard classification of the most critical web application security risks — yet in practice, it is rarely consulted until after an incident or an audit.

When developers use LLMs to generate code, they typically provide short, goal-oriented prompts: *"create a login endpoint"*, *"add file upload to the API"*. These prompts carry no security context. The model produces functional code, but the security constraints are left entirely to chance or to a post-hoc review.

Hellmet closes this gap at the source. Before the prompt reaches any LLM, it is enriched with the precise OWASP constraints that apply to the detected technical domain. The developer does not need to memorize the OWASP specification — the tool does the mapping automatically and injects it as a machine-readable constraint block.

The principle is simple: **if the security requirements are in the prompt, the model is forced to account for them**.

---

## How it works

1. The developer types a free-text coding intention.
2. Hellmet detects the programming language and technical domains (authentication, database, file upload, API, frontend, cryptography).
3. The relevant OWASP rules are selected and sorted by severity (critical first).
4. The intention is rewritten as a structured prompt in two formats: Claude XML and GPT Markdown.
5. Optionally, the prompt is further enriched by a Groq-hosted LLM (Llama 3.3 70B) acting strictly as a prompt rewriter — not as a code generator.

---

## Examples

### Input

> Create a Node.js route that handles file uploads from authenticated users and stores them on S3.

### Detected domains

`api`, `upload`, `auth`

### Injected OWASP rules

| Rule | Severity | Constraint |
|------|----------|-----------|
| A01 — Access Control | critical | Verify authentication and authorization before any action. |
| A02 — Cryptographic Failures | critical | Use TLS for all transfers; never expose credentials in logs or responses. |
| A04 — Insecure Design | high | Validate the real MIME type of the file, not just the extension. Enforce maximum file size. |
| A07 — Identification and Auth | high | Validate the session token on every request; invalidate it on logout. |
| A08 — Software and Data Integrity | high | Verify the integrity of uploaded files; reject executable content. |
| A06 — Vulnerable Components | medium | Audit all third-party dependencies used in this feature. |

### Generated Claude XML prompt

```xml
<task>
Create a Node.js route that handles file uploads from authenticated users and stores them on S3.
</task>

<security_constraints>
[A01 — Access Control] Verify authentication and authorization before any action.
[A02 — Cryptographic Failures] Use TLS for all transfers; never expose credentials in logs or responses.
[A04 — Insecure Design] Validate the real MIME type of the file, not just the extension. Enforce maximum file size.
[A07 — Identification and Auth] Validate the session token on every request; invalidate it on logout.
[A08 — Software and Data Integrity] Verify the integrity of uploaded files; reject executable content.
[A06 — Vulnerable Components] Audit all third-party dependencies used in this feature.
</security_constraints>

<instructions>
Reply only with secure code that satisfies all the constraints above.
Explicitly acknowledge each constraint in a comment at the top of the file.
</instructions>
```

---

### Another example

**Input:** *"Add a password reset form with email verification"*

**Detected domains:** `auth`, `frontend`

**Key injected rules:** A02 (hash passwords with bcrypt, enforce minimum entropy), A07 (rate-limit reset attempts, expire tokens after 15 minutes), A03 (sanitize all user inputs before rendering).

The developer pastes the generated prompt directly into Claude, ChatGPT, or Cursor. The model receives the security requirements as hard constraints, not as optional suggestions.

---

## Features

- Automatic domain detection from free text (language + technical context)
- Full OWASP Top 10 (2021) coverage with severity levels
- Manual rule override via toggle buttons
- Two output formats: Claude XML and GPT Markdown
- FR / EN output language selector
- AI enrichment via Groq (Llama 3.3 70B) — rewrites without executing
- Session history (last 5 prompts, stored locally)
- Keyboard shortcut: `Ctrl+Enter` to generate

---

## Installation

**Requirements:** Node.js 20+, npm 10+

```bash
git clone https://github.com/your-org/hellmet.git
cd hellmet
npm install
```

Copy the environment file and add your Groq API key (required for AI enrichment only — the core prompt builder works without it):

```bash
cp .env.example .env.local
```

```env
GROQ_API_KEY=your_key_here
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running tests

```bash
npm test
```

The test suite covers all core modules (`detector`, `prompt-builder`, `owasp-map`) and the conditional-logic UI components (`OutputPanel`, `Toggles`).

```bash
npm run test:watch   # watch mode
```
