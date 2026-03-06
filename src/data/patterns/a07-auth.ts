import type { VulnerabilityPattern } from "./types";

export const A07_PATTERNS: VulnerabilityPattern[] = [
  {
    id: "hardcoded-credentials",
    ruleId: "A07",
    regex: /(?:username|user|password)\s*[:=]\s*["'][^"']+["']/gi,
    targetSide: "both",
    explanation: "Identifiants codés en dur — utiliser des variables d'environnement ou un gestionnaire de secrets.",
    explanation_en: "Hardcoded credentials — use environment variables or a secrets manager.",
  },
  {
    id: "jwt-no-expiry",
    ruleId: "A07",
    regex: /jwt\.sign\s*\(/g,
    targetSide: "server",
    explanation: "jwt.sign() appelé sans expiresIn — les tokens sans expiration restent valides indéfiniment.",
    explanation_en: "jwt.sign() called without expiresIn — tokens without expiry remain valid indefinitely.",
    validate: (code, matchStart) => {
      const after = code.slice(matchStart, matchStart + 400);
      return !after.includes("expiresIn");
    },
  },
  {
    id: "jwt-none-algorithm",
    ruleId: "A07",
    regex: /algorithm\s*:\s*['"]none['"]/gi,
    explanation: "JWT avec algorithme 'none' — désactive la signature, permet la falsification de token.",
    explanation_en: "JWT with 'none' algorithm — disables signature, allows token forgery.",
  },
  {
    id: "jwt-weak-secret",
    ruleId: "A07",
    regex: /jwt\.(?:sign|verify)\s*\([^,]+,\s*["'][^"']{1,8}["']/g,
    explanation: "Secret JWT trop court (< 8 caractères) — insuffisant contre le brute force.",
    explanation_en: "JWT secret too short (< 8 chars) — insufficient against brute force.",
  },
  {
    id: "password-plain-text-compare",
    ruleId: "A07",
    regex: /password\s*===?\s*req\.(?:body|query)\.\w+/gi,
    explanation: "Comparaison de mot de passe en clair — utiliser bcrypt.compare() ou argon2.verify().",
    explanation_en: "Plain-text password comparison — use bcrypt.compare() or argon2.verify().",
  },
  {
    id: "session-no-secret",
    ruleId: "A07",
    regex: /session\s*\(\s*\{(?![^}]*secret)/gi,
    explanation: "Session configurée sans secret — les sessions peuvent être falsifiées.",
    explanation_en: "Session configured without a secret — sessions can be forged.",
  },
];
