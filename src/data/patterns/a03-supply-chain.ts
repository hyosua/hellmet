import type { VulnerabilityPattern } from "./types";

export const A03_PATTERNS: VulnerabilityPattern[] = [
  {
    id: "unpinned-dependency",
    ruleId: "A03",
    regex: /"(?:dependencies|devDependencies)"\s*:\s*\{[^}]*"[^"]+"\s*:\s*"(?:\^|~|>|>=|\*)"/g,
    explanation: "Dépendance non épinglée (^, ~, *, >) — une version malveillante peut s'installer automatiquement.",
    explanation_en: "Unpinned dependency (^, ~, *, >) — a malicious version can be installed automatically.",
  },
  {
    id: "require-user-path",
    ruleId: "A03",
    regex: /require\s*\(\s*(?:req\.|params\.|query\.|body\.)/gi,
    explanation: "require() avec un chemin contrôlé par l'utilisateur — inclusion de module arbitraire.",
    explanation_en: "require() with user-controlled path — arbitrary module inclusion risk.",
  },
  {
    id: "postinstall-script",
    ruleId: "A03",
    regex: /"postinstall"\s*:\s*"[^"]{10,}"/g,
    explanation: "Script postinstall dans package.json — vecteur courant d'exécution de code malveillant à l'installation.",
    explanation_en: "postinstall script in package.json — common vector for malicious code execution during install.",
  },
  {
    id: "integrity-missing-cdn",
    ruleId: "A03",
    regex: /<script[^>]+src\s*=\s*['"]https?:\/\/(?!localhost)[^'"]+['"][^>]*>/gi,
    explanation: "Script externe sans Subresource Integrity (SRI) — risque si le CDN est compromis.",
    explanation_en: "External script without Subresource Integrity (SRI) — risk if CDN is compromised.",
    validate: (_code, matchStart, matchEnd) => {
      const tag = _code.slice(matchStart, matchEnd);
      return !tag.includes("integrity=");
    },
  },
  {
    id: "http-registry",
    ruleId: "A03",
    regex: /registry\s*=\s*http:\/\//gi,
    explanation: "Registry npm en HTTP — les paquets téléchargés ne sont pas chiffrés ni vérifiés.",
    explanation_en: "npm registry over HTTP — downloaded packages are not encrypted or verified.",
  },
  {
    id: "curl-pipe-bash",
    ruleId: "A03",
    regex: /curl\s+[^|]*\|\s*(?:bash|sh|zsh)/gi,
    explanation: "curl | bash — exécution d'un script distant sans vérification d'intégrité, vecteur classique de supply chain.",
    explanation_en: "curl | bash — executing a remote script without integrity check, classic supply chain vector.",
  },
  {
    id: "outdated-unmaintained-module",
    ruleId: "A03",
    regex: /require\s*\(\s*['"](?:node-uuid|sha\.js|crc32|cryptiles|hawk|request)['"]\s*\)/gi,
    explanation: "Module obsolète ou abandonné détecté — remplacer par une alternative maintenue activement.",
    explanation_en: "Obsolete or abandoned module detected — replace with an actively maintained alternative.",
  },
];
