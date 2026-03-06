# Hellmet

**A static code vulnerability analyzer powered by OWASP Top 10 (2025).**

hellmet scans a code snippet for security vulnerabilities using client-side regex patterns, groups findings by OWASP rule, and generates a structured XML fix prompt ready to paste into any LLM.

A secondary tool — the Prompt Builder — lets you add security context to a plain-language coding intention instead. It is available at `/prompt`.

---

## Contents

- [Why scan code before prompting](#why-scan-code-before-prompting)
- [How it works](#how-it-works)
- [Examples](#examples)
- [Detected patterns](#detected-patterns)
- [Features](#features)
- [Installation](#installation)
- [Running tests](#running-tests)
- [Lire en français](README.fr.md)

---

## Why scan code before prompting

LLM-generated code is functional by default, secure by accident. When developers paste AI-generated snippets into their codebase without review, common vulnerabilities — SQL injection, hardcoded secrets, missing JWT expiry, empty catch blocks — slip through unnoticed.

Hellmet closes this gap before the patch reaches production. Paste the code, get an annotated vulnerability report, then paste the generated fix prompt directly into Claude or ChatGPT. The model receives the exact OWASP constraints that apply, not a generic "make this secure" instruction.

The principle: **name the vulnerability, cite the rule, get a targeted fix**.

---

## How it works

### Code Analyzer (main feature — `/`)

1. Paste a code snippet into the input area.
2. Click **Analyze** — detection runs entirely client-side, synchronously.
3. Matches are grouped by OWASP rule (A01–A10), with line number, snippet, and explanation.
4. Affected OWASP toggles are automatically activated (greyed out — auto-detected).
5. Click **Generate fix prompt** — produces a structured XML prompt with the original code block and the applicable constraints sorted by severity.
6. Copy and paste into your LLM.

### Prompt Builder (secondary feature — `/prompt`)

Type a free-text coding intention. Hellmet detects the technical domain and language, maps them to OWASP rules, and outputs a security-hardened prompt. Useful before writing code rather than after.

---

## Examples

### Input (Code Analyzer)

```php
$user_id = $_GET['user_id'];
$query = "SELECT * FROM users WHERE id = $user_id";
$result = mysqli_query($conn, $query);
```

### Detected vulnerabilities

| Rule | Pattern | Line | Finding |
|------|---------|------|---------|
| A05 — Injection | `sql-php-interpolation` | 2 | PHP variable interpolation inside a SQL string |

### Generated fix prompt

```xml
<task>
Fix the security vulnerabilities in the code below.
</task>

<code>
$user_id = $_GET['user_id'];
$query = "SELECT * FROM users WHERE id = $user_id";
$result = mysqli_query($conn, $query);
</code>

<security_constraints>
[A05 — Injection] Use exclusively parameterized queries or an ORM. No string
concatenation to build SQL queries, shell commands, or LDAP expressions.
</security_constraints>

<instructions>
Reply only with the fixed code. For each change, add an inline comment
explaining the OWASP correction.
</instructions>
```

---

### Another example

**Input:**
```javascript
const token = jwt.sign({ userId: user.id }, SECRET);
const secret = "hardcoded_api_key_123";
```

**Detected:** A07 (`jwt-no-expiry`) + A04 (`hardcoded-secret`)

**Fix prompt** includes both rules sorted by severity (A04 critical before A07 critical), with the original code block embedded in `<code>`.

---

## Detected patterns

19 patterns across 6 OWASP categories:

| Pattern | Rule | Targets |
|---------|------|---------|
| `sql-template-literal` | A05 | JS template literal with SQL and `${` |
| `sql-php-interpolation` | A05 | PHP double-quoted string with SQL and `$var` |
| `sql-string-concat` | A05 | Variable concatenated into a SQL string |
| `eval-call` | A05 | `eval(` |
| `innerHTML-assign` | A05 | `.innerHTML =` |
| `dangerously-set-html` | A05 | `dangerouslySetInnerHTML={{` |
| `document-write` | A05 | `document.write(` |
| `hardcoded-secret` | A04 | `secret/password/token/key = "..."` |
| `math-random-token` | A04 | `Math.random()` |
| `md5-usage` | A04 | `md5(` |
| `sha1-usage` | A04 | `sha1(` |
| `hardcoded-credentials` | A07 | `username/user/password = "..."` |
| `jwt-no-expiry` | A07 | `jwt.sign(` without `expiresIn` in scope |
| `cors-wildcard` | A02 | `origin: '*'` |
| `debug-true` | A02 | `debug: true` |
| `httponly-false` | A02 | `httpOnly: false` |
| `unsafe-json-parse` | A08 | `JSON.parse(req.` |
| `password-in-log` | A09 | `console.log(... password/token/secret)` |
| `empty-catch` | A10 | `catch(e) {}` |

Detection is fully client-side (regex, synchronous). No server call, no external dependency.

---

## Features

**Code Analyzer (`/`)**
- Static vulnerability detection: 19 patterns, 6 OWASP categories, instant
- Report grouped by rule with line number, snippet, and explanation (FR/EN)
- OWASP toggles auto-activated on detection, manually overridable
- Fix prompt: XML with `<code>` block + constraints sorted by severity
- Copy to clipboard

**Prompt Builder (`/prompt`)**
- Domain detection from free text (11 languages, 6 domains)
- OWASP Top 10 (2025) rule injection sorted by severity
- Manual toggle override, session history (last 5 prompts)
- Optional AI enrichment via Groq (Llama 3.3 70B)

**Both tools**
- FR / EN output selector
- Dark / light theme
- OWASP Top 10 — 2025

---

## Installation

**Requirements:** Node.js 20+, npm 10+

```bash
git clone https://github.com/your-org/hellmet.git
cd hellmet
npm install
```

Copy the environment file and add your Groq API key (required for AI enrichment only — the analyzer and prompt builder both work without it):

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

Open [http://localhost:3000](http://localhost:3000) for the Code Analyzer.
Open [http://localhost:3000/prompt](http://localhost:3000/prompt) for the Prompt Builder.

---

## Running tests

```bash
npm test
```

The test suite covers all core modules (`code-analyzer`, `detector`, `prompt-builder`, `owasp-map`) and the UI components (`OutputPanel`, `Toggles`).

74 tests — unit + component.
