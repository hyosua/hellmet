import type { OWASPRule, PromptOutput, Severity } from "./types";

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };

function sortBySeverity(rules: OWASPRule[]): OWASPRule[] {
  return [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}

type Lang = "fr" | "en";

const LABELS: Record<Lang, { noConstraints: string; instructions: string }> = {
  fr: {
    noConstraints:
      "Aucune contrainte de sécurité spécifique n'a été détectée. " +
      "Active les règles OWASP manuellement si nécessaire.",
    instructions:
      "Réponds uniquement avec du code sécurisé respectant toutes les contraintes ci-dessus.\n" +
      "Indique explicitement chaque contrainte respectée dans un commentaire en tête de fichier.",
  },
  en: {
    noConstraints:
      "No specific security constraints were detected. " +
      "Enable OWASP rules manually if needed.",
    instructions:
      "Reply only with secure code that satisfies all the constraints above.\n" +
      "Explicitly acknowledge each constraint in a comment at the top of the file.",
  },
};

/**
 * Builds a security-hardened prompt in XML format.
 */
export function buildPrompt(
  intention: string,
  rules: OWASPRule[],
  lang: Lang = "fr"
): PromptOutput {
  const L = LABELS[lang];
  const sorted = sortBySeverity(rules);
  const constraints =
    sorted.length > 0
      ? sorted.map((r) => `[${r.id} — ${r.name}] ${lang === "en" ? r.constraint_en : r.constraint}`).join("\n")
      : L.noConstraints;

  return `<task>
${intention.trim()}
</task>

<security_constraints>
${constraints}
</security_constraints>

<instructions>
${L.instructions}
</instructions>`;
}
