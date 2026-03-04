# Data Model: Hellmet — Secure Prompt Box

**Phase**: 1 — Design & Contracts
**Date**: 2026-03-04

---

## Entities

### Intention

The raw text entered by the user describing what they want to code.

| Field | Type | Constraints |
|-------|------|-------------|
| `text` | `string` | Required, non-empty, no max length enforced in v1 |

---

### Detection

The result of analyzing an Intention. Produced by the client-side detector.

| Field | Type | Constraints |
|-------|------|-------------|
| `language` | `string \| null` | e.g., `"Node.js"`, `"Python"`, `null` if not detected |
| `domain` | `DomainKey \| null` | One of the 6 recognized domains, or `null` |
| `matchedKeywords` | `string[]` | Keywords that triggered the detection (for UI transparency) |

**DomainKey enum**: `"api" | "auth" | "upload" | "database" | "frontend" | "crypto"`

---

### OWASPRule

A single OWASP 2025 rule with its associated security constraint text.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `OWASPRuleId` | e.g., `"A01"`, `"A02"`, … `"A09"` |
| `name` | `string` | Human-readable name (e.g., `"Access Control"`) |
| `constraint` | `string` | Injected constraint text for prompt generation |

**Stored in**: `src/data/rules.json` (static file, bundled with the app)

**OWASPRuleId enum**: `"A01" | "A02" | "A03" | "A04" | "A05" | "A07" | "A09"`

---

### DomainMapping

Maps a DomainKey to the set of OWASP rules automatically injected when that domain is detected.

| Domain | OWASP Rules |
|--------|-------------|
| `auth` | A02, A07 |
| `upload` | A01, A04 |
| `database` | A03 |
| `api` | A01, A05 |
| `frontend` | A03, A05 |
| `crypto` | A02 |

**Stored in**: `src/core/owasp-map.ts` (static constant, no runtime mutation)

---

### ActiveRuleSet

The effective set of OWASP rules applied to a generation, combining auto-detection and manual toggles.

| Field | Type | Description |
|-------|------|-------------|
| `autoDetected` | `Set<OWASPRuleId>` | Rules from domain mapping |
| `manualToggles` | `Set<OWASPRuleId>` | Rules activated via UI toggles |
| `effective` | `Set<OWASPRuleId>` | Union of the two above (no duplicates) |

---

### PromptOutput

The generated prompt in two LLM-specific formats.

| Field | Type | Description |
|-------|------|-------------|
| `claude` | `string` | XML-structured prompt for Claude |
| `gpt` | `string` | Markdown prompt for GPT/Cursor |

**Claude format structure**:
```xml
<task>
[reformulated intention]
</task>

<security_constraints>
[one constraint per line]
</security_constraints>

<instructions>
Réponds uniquement avec du code sécurisé respectant toutes les contraintes ci-dessus.
Indique explicitement chaque contrainte respectée dans un commentaire en tête de fichier.
</instructions>
```

**GPT/Cursor format structure**:
```markdown
### Tâche
[reformulated intention]

### Contraintes de sécurité obligatoires
- [constraint 1]
- [constraint 2]

### Instructions
Tu es en mode audit strict. Chaque ligne de code doit respecter les contraintes ci-dessus.
```

---

### AppState

The complete runtime state of the single-page application.

| Field | Type | Initial Value |
|-------|------|---------------|
| `intention` | `string` | `""` |
| `detection` | `Detection \| null` | `null` |
| `toggles` | `Record<OWASPRuleId, boolean>` | All `false` |
| `output` | `PromptOutput \| null` | `null` |
| `isLoading` | `boolean` | `false` |

**State transitions**:
```
Initial → [user types] → intention updated
intention → [user submits] → isLoading: true → detection computed → activeRules computed → output generated → isLoading: false
toggles → [user clicks toggle] → toggle flipped → if output exists: output regenerated
output → [user clicks copy] → clipboard write → visual feedback (2s)
```

---

## Validation Rules

- `intention` must be non-empty before generation can proceed.
- Detection result with `domain: null` produces empty `autoDetected` set — generation still proceeds (manual toggles may still apply).
- `effective` rule set may be empty — prompt is generated with no security constraints and a notice is shown.
- No field is persisted beyond the browser session.
