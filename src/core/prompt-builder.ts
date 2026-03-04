import type { OWASPRule, PromptOutput } from "./types";

const NO_CONSTRAINTS_NOTICE =
  "Aucune contrainte de sécurité spécifique n'a été détectée. " +
  "Active les règles OWASP manuellement si nécessaire.";

/**
 * Builds a Claude XML-formatted security-hardened prompt.
 */
function buildClaudeFormat(intention: string, rules: OWASPRule[]): string {
  const constraints =
    rules.length > 0
      ? rules.map((r) => `[${r.id} — ${r.name}] ${r.constraint}`).join("\n")
      : NO_CONSTRAINTS_NOTICE;

  return `<task>
${intention.trim()}
</task>

<security_constraints>
${constraints}
</security_constraints>

<instructions>
Réponds uniquement avec du code sécurisé respectant toutes les contraintes ci-dessus.
Indique explicitement chaque contrainte respectée dans un commentaire en tête de fichier.
</instructions>`;
}

/**
 * Builds a GPT/Cursor Markdown-formatted security-hardened prompt.
 */
function buildGptFormat(intention: string, rules: OWASPRule[]): string {
  const constraints =
    rules.length > 0
      ? rules
          .map((r) => `- [${r.id} — ${r.name}] ${r.constraint}`)
          .join("\n")
      : `- ${NO_CONSTRAINTS_NOTICE}`;

  return `### Tâche
${intention.trim()}

### Contraintes de sécurité obligatoires
${constraints}

### Instructions
Tu es en mode audit strict. Chaque ligne de code doit respecter les contraintes ci-dessus.`;
}

/**
 * Builds a security-hardened prompt in two LLM-optimized formats.
 *
 * @param intention - The raw user coding intention
 * @param rules     - The active OWASP rules to inject
 * @returns PromptOutput with `claude` (XML) and `gpt` (Markdown) variants
 */
export function buildPrompt(
  intention: string,
  rules: OWASPRule[]
): PromptOutput {
  return {
    claude: buildClaudeFormat(intention, rules),
    gpt: buildGptFormat(intention, rules),
  };
}
