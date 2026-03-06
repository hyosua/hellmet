import type { VulnerabilityPattern } from "./types";

export const A09_PATTERNS: VulnerabilityPattern[] = [
  {
    id: "password-in-log",
    ruleId: "A09",
    regex: /console\.log\s*\([^)]*(?:password|token|secret)/gi,
    targetSide: "both",
    explanation: "Journalisation d'un mot de passe, token ou secret — ne jamais logger des données sensibles.",
    explanation_en: "Logging a password, token, or secret — never log sensitive data.",
  },
  {
    id: "sensitive-data-in-url",
    ruleId: "A09",
    regex: /(?:GET|res\.redirect)\s*[^)]*(?:password|token|secret|api_?key)=/gi,
    explanation: "Données sensibles dans une URL — apparaîtront dans les logs serveur et l'historique navigateur.",
    explanation_en: "Sensitive data in a URL — will appear in server logs and browser history.",
  },
  {
    id: "no-auth-event-logging",
    ruleId: "A09",
    regex: /(?:login|signin|authenticate)\s*\([^{)]*\)\s*\{/gi,
    explanation: "Fonction d'authentification sans logging apparent — les tentatives doivent être auditées et alertées.",
    explanation_en: "Authentication function without apparent logging — attempts must be audited and alerted.",
    validate: (code, matchStart) => {
      const after = code.slice(matchStart, matchStart + 500);
      return !/(console\.|logger\.|log\.|audit|alert)/i.test(after);
    },
  },
];
