import type { VulnerabilityPattern } from "./types";

export const A10_PATTERNS: VulnerabilityPattern[] = [
  {
    id: "empty-catch",
    ruleId: "A10",
    regex: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    targetSide: "both",
    explanation: "Bloc catch vide — les erreurs sont silencieusement ignorées, rendant le débogage impossible.",
    explanation_en: "Empty catch block — errors are silently swallowed, making debugging impossible.",
  },
  {
    id: "catch-only-console",
    ruleId: "A10",
    regex: /catch\s*\([^)]*\)\s*\{\s*console\.log\s*\([^)]*\)\s*\}/g,
    explanation: "Catch avec uniquement un console.log — l'erreur n'est pas propagée ni correctement traitée.",
    explanation_en: "Catch with only a console.log — error is not propagated or properly handled.",
  },
  {
    id: "fail-open-auth",
    ruleId: "A10",
    regex: /catch\s*\([^)]*\)\s*\{[^}]*return\s+true/g,
    explanation: "Fail-open dans un catch — une exception accorde l'accès au lieu de le refuser (pattern dangereux).",
    explanation_en: "Fail-open in a catch block — an exception grants access instead of denying it (dangerous pattern).",
  },
  {
    id: "unhandled-promise-rejection",
    ruleId: "A10",
    regex: /\.then\s*\([^)]+\)(?!\s*\.catch)/g,
    explanation: "Promise .then() sans .catch() — les rejections non gérées provoquent des comportements imprévisibles.",
    explanation_en: "Promise .then() without .catch() — unhandled rejections cause unpredictable behavior.",
    validate: (code, _matchStart, matchEnd) => {
      const after = code.slice(matchEnd, matchEnd + 100);
      return !after.includes(".catch");
    },
  },
  {
    id: "empty-catch-php",
    ruleId: "A10",
    regex: /catch\s*\(\s*(?:Exception|\\\w+Exception)\s+\$\w+\s*\)\s*\{\s*\}/g,
    explanation: "Exception PHP silencieusement ignorée dans un bloc catch vide.",
    explanation_en: "PHP exception silently swallowed in an empty catch block.",
  },
];
