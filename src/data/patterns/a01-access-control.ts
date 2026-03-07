import type { VulnerabilityPattern } from "./types";

export const A01_PATTERNS: VulnerabilityPattern[] = [
  {
    id: "path-traversal",
    ruleId: "A01",
    regex: /(?:readFile|createReadStream|readFileSync|writeFile|unlink)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/g,
    explanation: "Accès fichier basé sur une entrée utilisateur — risque de path traversal (../../etc/passwd).",
    explanation_en: "File access based on user input — path traversal risk (../../etc/passwd).",
  },
  {
    id: "python-open-concat",
    ruleId: "A01",
    regex: /\bopen\s*\([^)]*["'][^"']*["']\s*\+/gi,
    explanation: "Concaténation de chaîne dans open() — risque de path traversal (../../etc/passwd).",
    explanation_en: "String concatenation in open() — path traversal risk (../../etc/passwd).",
  },
  {
    id: "python-open-fstring",
    ruleId: "A01",
    regex: /\bopen\s*\(\s*f["'][^"']*\{/gi,
    explanation: "F-string dans open() — risque de path traversal si la variable provient d'une entrée utilisateur.",
    explanation_en: "F-string in open() — path traversal risk if the variable comes from user input.",
  },
  {
    id: "mass-assignment",
    ruleId: "A01",
    regex: /Object\.assign\s*\(\s*(?:user|account|profile|admin|role)\s*,\s*req\./gi,
    explanation: "Assignation de masse depuis req.body — un utilisateur peut écraser des champs sensibles (ex: isAdmin).",
    explanation_en: "Mass assignment from req.body — user may overwrite sensitive fields (e.g., isAdmin).",
  },
  {
    id: "direct-object-reference",
    ruleId: "A01",
    regex: /findById\s*\(\s*req\.(?:params|query|body)\./gi,
    explanation: "Référence directe à un objet via l'entrée utilisateur sans vérification d'autorisation (IDOR).",
    explanation_en: "Direct object reference from user input without authorization check (IDOR).",
  },
  {
    id: "prototype-pollution",
    ruleId: "A01",
    regex: /\[['"]__proto__['"]\]|\.__proto__\s*=/g,
    explanation: "Accès ou modification de __proto__ — pollution de prototype pouvant bypasser des contrôles d'accès.",
    explanation_en: "Access or modification of __proto__ — prototype pollution, may bypass access controls.",
  },
  {
    id: "ssrf-fetch-user-input",
    ruleId: "A01",
    regex: /(?:fetch|axios\.get|axios\.post|axios\.request|http\.get|https\.get|request)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
    explanation: "Requête HTTP vers une URL contrôlée par l'utilisateur — risque de SSRF. Classé A01:2025 (Broken Access Control).",
    explanation_en: "HTTP request to a user-controlled URL — SSRF risk. Classified under A01:2025 (Broken Access Control).",
  },
  {
    id: "ssrf-python-requests",
    ruleId: "A01",
    regex: /(?:requests|httpx|urllib\.request)\s*\.(?:get|post|put|delete|patch|head|request|urlopen)\s*\(\s*\w+/gi,
    explanation: "Requête HTTP Python vers une URL potentiellement contrôlée — risque de SSRF.",
    explanation_en: "Python HTTP request to a potentially user-controlled URL — SSRF risk.",
  },
  {
    id: "ssrf-url-redirect",
    ruleId: "A01",
    regex: /res\.redirect\s*\(\s*(?:req\.|params\.|query\.|body\.)\w+/gi,
    explanation: "Redirection vers une URL fournie par l'utilisateur sans validation — SSRF ou open redirect.",
    explanation_en: "Redirect to user-provided URL without validation — SSRF or open redirect risk.",
  },
];
