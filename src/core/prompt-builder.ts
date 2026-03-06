import type { AnalysisContext, Framework, OWASPRule, PromptOutput, Severity, TargetSide } from "./types";
import { FRAMEWORK_LABELS } from "./framework-detector";

export type Lang = "fr" | "en";

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };

function sortBySeverity(rules: OWASPRule[]): OWASPRule[] {
  return [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}

const LABELS: Record<Lang, { noConstraints: string; instructions: string }> = {
  fr: {
    noConstraints:
      "Aucune contrainte de sécurité spécifique n'a été détectée. " +
      "Active les règles OWASP manuellement si nécessaire.",
    instructions:
      "Réponds uniquement avec du code sécurisé respectant toutes les contraintes ci-dessus.\n"
  },
  en: {
    noConstraints:
      "No specific security constraints were detected. " +
      "Enable OWASP rules manually if needed.",
    instructions:
      "Reply only with secure code that satisfies all the constraints above.\n"
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

const FIX_LABELS: Record<Lang, { task: string; instructions: string }> = {
  fr: {
    task: "Corrige les vulnérabilités de sécurité dans le code ci-dessous.",
    instructions:
      "Réponds uniquement avec le code corrigé. Pour chaque modification, ajoute un commentaire inline expliquant la correction OWASP.\n",
  },
  en: {
    task: "Fix the security vulnerabilities in the code below.",
    instructions:
      "Reply only with the fixed code. For each change, add an inline comment explaining the OWASP correction.\n",
  },
};

function buildContextBlock(context: AnalysisContext, lang: Lang): string | null {
  const parts: string[] = [];
  if (context.framework) {
    const label = FRAMEWORK_LABELS[context.framework] ?? context.framework;
    parts.push(lang === "fr" ? `Framework : ${label}` : `Framework: ${label}`);
  }
  if (context.targetSide !== "both") {
    const sideLabel: Record<Exclude<TargetSide, "both">, Record<Lang, string>> = {
      client: { fr: "Client-side", en: "Client-side" },
      server: { fr: "Côté serveur", en: "Server-side" },
    };
    parts.push(lang === "fr"
      ? `Cible : ${sideLabel[context.targetSide as Exclude<TargetSide, "both">].fr}`
      : `Target: ${sideLabel[context.targetSide as Exclude<TargetSide, "both">].en}`
    );
  }
  return parts.length > 0 ? parts.join(" — ") : null;
}

/**
 * Builds a fix prompt for code vulnerability correction in XML format.
 */
export function buildFixPrompt(
  code: string,
  rules: OWASPRule[],
  lang: Lang = "fr",
  context?: AnalysisContext
): PromptOutput {
  const L = FIX_LABELS[lang];
  const sorted = sortBySeverity(rules);
  const constraints =
    sorted.length > 0
      ? sorted.map((r) => `[${r.id} — ${r.name}] ${lang === "en" ? r.constraint_en : r.constraint}`).join("\n")
      : lang === "fr"
        ? "Aucune contrainte de sécurité spécifique détectée."
        : "No specific security constraints detected.";

  const contextLine = context ? buildContextBlock(context, lang) : null;
  const contextBlock = contextLine
    ? `\n<context>\n${contextLine}\n</context>\n`
    : "";

  return `<task>
${L.task}
</task>
${contextBlock}
<code>
${code}
</code>

<security_constraints>
${constraints}
</security_constraints>

<instructions>
${L.instructions}
</instructions>`;
}
