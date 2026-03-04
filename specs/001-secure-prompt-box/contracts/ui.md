# UI Contracts: Hellmet — Secure Prompt Box

**Date**: 2026-03-04

---

## Component: `SingleBox`

The root interactive component. Owns the full AppState.

### Props

None — this is the top-level page component.

### Responsibilities

- Renders the intention textarea
- Renders the `Toggles` component
- Triggers generation on submit
- Passes output to `OutputPanel`
- Shows detection metadata below the output

### Emitted Events / Callbacks

None (owns all state internally via `useReducer`).

---

## Component: `Toggles`

Displays OWASP rule toggle buttons and manages manual activation.

### Props

```ts
interface TogglesProps {
  activeToggles: Set<OWASPRuleId>;         // currently manually activated rules
  autoDetected: Set<OWASPRuleId>;          // rules already detected automatically
  onChange: (id: OWASPRuleId, active: boolean) => void;
}
```

### Behavior

- Each toggle shows its rule ID and name (e.g., "A01 Access Control").
- Visually distinct states:
  - `auto` — detected automatically (highlighted, non-togglable indicator)
  - `manual` — activated manually by user (highlighted)
  - `inactive` — neither (muted/gray)
- Toggles persist state across multiple submissions within the session.
- A rule already in `autoDetected` can still be toggled manually — it simply has no effect on the output (already included).

---

## Component: `OutputPanel`

Displays the generated prompt and copy buttons.

### Props

```ts
interface OutputPanelProps {
  output: PromptOutput | null;             // null = no generation yet
  isLoading: boolean;
  detection: Detection | null;
  activeRules: Set<OWASPRuleId>;
}
```

### Behavior

- Loading state: shows a spinner/skeleton in place of the output.
- No output yet: shows placeholder text ("Le prompt sécurisé apparaîtra ici").
- Output ready:
  - Displays formatted prompt text in a monospace read-only textarea.
  - "Copy for Claude" button copies `output.claude` to clipboard.
  - "Copy for GPT" button copies `output.gpt` to clipboard.
  - After copy: button label changes to "Copié !" for 2 seconds, then reverts.
- Detection metadata shown below the output:
  - `Détection : {language} · {domain}` (or "Aucun domaine détecté" if null)
  - `Règles injectées : {A01, A04, …}` (or "Aucune" if empty set)
- If Clipboard API is unavailable: copy buttons are disabled with a tooltip explaining why.

---

## Interaction Flow

```
User types in textarea
    ↓
User clicks [→ Run] (or presses Ctrl+Enter)
    ↓
SingleBox → runs detection → runs prompt builder → sets output
    ↓
OutputPanel renders with new output + detection metadata
    ↓
User clicks [Copy for Claude] or [Copy for GPT]
    ↓
Clipboard write → visual confirmation for 2s
```

---

## Accessibility Contracts

- All interactive elements (textarea, toggles, buttons) must be keyboard-navigable.
- Toggle buttons use `role="button"` with `aria-pressed` state.
- Copy buttons announce success via `aria-live` region for screen readers.
- Color alone is not the only differentiator for toggle states (use text labels or icons in addition).
