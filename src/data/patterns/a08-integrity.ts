import type { VulnerabilityPattern } from "./types";

export const A08_PATTERNS: VulnerabilityPattern[] = [
  {
    id: "unsafe-json-parse",
    ruleId: "A08",
    regex: /JSON\.parse\s*\(\s*req\./g,
    targetSide: "server",
    explanation: "JSON.parse() appliqué directement sur des données de requête — valider et sanitiser les données entrantes.",
    explanation_en: "JSON.parse() applied directly on request data — validate and sanitize incoming data.",
  },
  {
    id: "unsafe-deserialization",
    ruleId: "A08",
    regex: /(?:deserialize|unserialize|pickle\.loads|yaml\.load\s*\([^)]*(?!SafeLoader))/gi,
    explanation: "Désérialisation potentiellement non sécurisée — utiliser des formats sûrs et valider les données.",
    explanation_en: "Potentially unsafe deserialization — use safe formats and validate data.",
  },
  {
    id: "no-subresource-integrity",
    ruleId: "A08",
    regex: /<(?:script|link)[^>]+(?:src|href)\s*=\s*['"]https?:\/\/(?!localhost)[^'"]+['"][^>]*>/gi,
    explanation: "Ressource externe sans Subresource Integrity — le contenu peut être altéré silencieusement.",
    explanation_en: "External resource without Subresource Integrity — content may be silently tampered.",
    validate: (_code, matchStart, matchEnd) => {
      const tag = _code.slice(matchStart, matchEnd);
      return !tag.includes("integrity=");
    },
  },
];
