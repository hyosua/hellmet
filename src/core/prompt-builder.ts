import type { OWASPRule, PromptOutput, Severity } from "./types";

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };

function sortBySeverity(rules: OWASPRule[]): OWASPRule[] {
  return [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}

type Lang = "fr" | "en";

const LABELS: Record<Lang, {
  noConstraints: string;
  claudeInstructions: string;
  gptTask: string;
  gptConstraints: string;
  gptInstructions: string;
}> = {
  fr: {
    noConstraints:
      "Aucune contrainte de sécurité spécifique n'a été détectée. " +
      "Active les règles OWASP manuellement si nécessaire.",
    claudeInstructions:
      "Réponds uniquement avec du code sécurisé respectant toutes les contraintes ci-dessus.\n" +
      "Indique explicitement chaque contrainte respectée dans un commentaire en tête de fichier.",
    gptTask: "### Tâche",
    gptConstraints: "### Contraintes de sécurité obligatoires",
    gptInstructions:
      "Tu es en mode audit strict. Chaque ligne de code doit respecter les contraintes ci-dessus.",
  },
  en: {
    noConstraints:
      "No specific security constraints were detected. " +
      "Enable OWASP rules manually if needed.",
    claudeInstructions:
      "Reply only with secure code that satisfies all the constraints above.\n" +
      "Explicitly acknowledge each constraint in a comment at the top of the file.",
    gptTask: "### Task",
    gptConstraints: "### Mandatory Security Constraints",
    gptInstructions:
      "You are in strict audit mode. Every line of code must comply with the constraints above.",
  },
};

/**
 * Builds a Claude XML-formatted security-hardened prompt.
 */
function buildClaudeFormat(intention: string, rules: OWASPRule[], lang: Lang): string {
  const L = LABELS[lang];
  const constraints =
    rules.length > 0
      ? rules.map((r) => `[${r.id} — ${r.name}] ${r.constraint}`).join("\n")
      : L.noConstraints;

  return `<task>
${intention.trim()}
</task>

<security_constraints>
${constraints}
</security_constraints>

<instructions>
${L.claudeInstructions}
</instructions>`;
}

/**
 * Builds a GPT/Cursor Markdown-formatted security-hardened prompt.
 */
function buildGptFormat(intention: string, rules: OWASPRule[], lang: Lang): string {
  const L = LABELS[lang];
  const constraints =
    rules.length > 0
      ? rules
          .map((r) => `- [${r.id} — ${r.name}] ${r.constraint}`)
          .join("\n")
      : `- ${L.noConstraints}`;

  return `${L.gptTask}
${intention.trim()}

${L.gptConstraints}
${constraints}

${L.gptInstructions}`;
}

/**
 * Builds a security-hardened prompt in two LLM-optimized formats.
 *
 * @param intention - The raw user coding intention
 * @param rules     - The active OWASP rules to inject
 * @param lang      - Output language: "fr" (default) or "en"
 * @returns PromptOutput with `claude` (XML) and `gpt` (Markdown) variants
 */
export function buildPrompt(
  intention: string,
  rules: OWASPRule[],
  lang: Lang = "fr"
): PromptOutput {
  const sorted = sortBySeverity(rules);
  return {
    claude: buildClaudeFormat(intention, sorted, lang),
    gpt: buildGptFormat(intention, sorted, lang),
  };
}
