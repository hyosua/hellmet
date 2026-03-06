import type { VulnerabilityPattern } from "./types";

export const A04_PATTERNS: VulnerabilityPattern[] = [
  {
    id: "md5-usage",
    ruleId: "A04",
    regex: /\bmd5\s*\(/gi,
    targetSide: "both",
    explanation: "Utilisation de MD5 — algorithme cassé, ne pas utiliser pour hacher des mots de passe ou des données sensibles.",
    explanation_en: "Use of MD5 — broken algorithm, do not use for hashing passwords or sensitive data.",
  },
  {
    id: "sha1-usage",
    ruleId: "A04",
    regex: /\bsha1\s*\(/gi,
    targetSide: "both",
    explanation: "Utilisation de SHA-1 — algorithme compromis, préférer SHA-256 ou bcrypt.",
    explanation_en: "Use of SHA-1 — compromised algorithm, prefer SHA-256 or bcrypt.",
  },
  {
    id: "weak-cipher",
    ruleId: "A04",
    regex: /(?:createCipher|createDecipher)\s*\(\s*['"](?:des|rc2|rc4|blowfish|aes-128-ecb|aes-256-ecb)['"]/gi,
    explanation: "Chiffrement faible ou mode ECB — utiliser AES-256-GCM ou ChaCha20-Poly1305.",
    explanation_en: "Weak cipher or ECB mode — use AES-256-GCM or ChaCha20-Poly1305.",
  },
  {
    id: "math-random-token",
    ruleId: "A04",
    regex: /Math\.random\s*\(\)/g,
    targetSide: "both",
    explanation: "Math.random() n'est pas cryptographiquement sûr — ne pas utiliser pour générer des tokens ou des secrets.",
    explanation_en: "Math.random() is not cryptographically secure — do not use for generating tokens or secrets.",
  },
  {
    id: "hardcoded-secret",
    ruleId: "A04",
    regex: /(?:secret|password|token|key)\s*=\s*["'][^"']{4,}["']/gi,
    targetSide: "both",
    explanation: "Secret ou clé codé en dur dans le code source — ne jamais stocker de secrets dans le code.",
    explanation_en: "Hardcoded secret or key in source code — never store secrets directly in code.",
  },
  {
    id: "http-not-https",
    ruleId: "A04",
    regex: /['"]http:\/\/(?!localhost|127\.0\.0\.1)/g,
    explanation: "URL HTTP vers un serveur distant — données en clair, utiliser HTTPS.",
    explanation_en: "HTTP URL to a remote server — plaintext transmission, use HTTPS.",
  },
];
