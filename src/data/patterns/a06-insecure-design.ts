import type { VulnerabilityPattern } from "./types";

export const A06_PATTERNS: VulnerabilityPattern[] = [
  {
    id: "no-rate-limiting",
    ruleId: "A06",
    regex: /app\.post\s*\(\s*['"]\/(?:login|signin|auth|register|reset-password)['"]/gi,
    explanation: "Route sensible sans rate limiting visible — risque de brute force (conception non sécurisée).",
    explanation_en: "Sensitive route without visible rate limiting — brute force risk (insecure design).",
    validate: (code, matchStart) => {
      const surrounding = code.slice(Math.max(0, matchStart - 300), matchStart + 300);
      return !/(rateLimit|throttle|limiter)/i.test(surrounding);
    },
  },
  {
    id: "missing-input-validation",
    ruleId: "A06",
    regex: /req\.body\.\w+\s*(?:!==|===|==|!=)\s*undefined/g,
    explanation: "Validation d'entrée insuffisante — utiliser Joi, Zod ou express-validator.",
    explanation_en: "Insufficient input validation — use Joi, Zod, or express-validator.",
  },
];
