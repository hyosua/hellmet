import type { VulnerabilityPattern } from "./types";

export const A05_PATTERNS: VulnerabilityPattern[] = [
  // SQL Injection
  {
    id: "sql-fstring",
    ruleId: "A05",
    regex: /f["'][^"']*(?:SELECT|INSERT|UPDATE|DELETE|DROP|WHERE|FROM)\b[^"']*\{/gi,
    targetSide: "server",
    explanation: "F-string Python avec interpolation dans une requête SQL — risque d'injection SQL.",
    explanation_en: "Python f-string with interpolation inside a SQL query — SQL injection risk.",
  },
  {
    id: "sql-template-literal",
    ruleId: "A05",
    regex: /`[^`]*(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^`]*\$\{/gi,
    targetSide: "server",
    explanation: "Interpolation de variable dans une requête SQL via template literal — risque d'injection SQL.",
    explanation_en: "Variable interpolation inside a SQL query template literal — SQL injection risk.",
  },
  {
    id: "sql-php-interpolation",
    ruleId: "A05",
    regex: /"[^"]*(?:SELECT|INSERT|UPDATE|DELETE|DROP|WHERE|FROM)\b[^"]*\$[a-zA-Z_]\w*/gi,
    targetSide: "server",
    explanation: "Interpolation de variable PHP dans une chaîne SQL — risque d'injection SQL.",
    explanation_en: "PHP variable interpolation inside a SQL string — SQL injection risk.",
  },
  {
    id: "sql-string-concat",
    ruleId: "A05",
    regex: /(SELECT|INSERT|UPDATE|DELETE|DROP)[^;]*\+\s*\$?\w+/gi,
    targetSide: "server",
    explanation: "Concaténation de variable dans une requête SQL — risque d'injection SQL.",
    explanation_en: "Variable concatenation inside a SQL query — SQL injection risk.",
  },
  {
    id: "raw-query-user-input",
    ruleId: "A05",
    regex: /\.(?:raw|query|exec)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
    explanation: "Requête brute avec données utilisateur non filtrées — injection SQL/NoSQL.",
    explanation_en: "Raw query with unfiltered user data — SQL/NoSQL injection.",
  },
  // Command Injection
  {
    id: "exec-user-input",
    ruleId: "A05",
    regex: /(?:exec|execSync|spawn|spawnSync|system|popen)\s*\([^)]*(?:req\.|params\.|query\.|body\.|\$_(?:GET|POST|REQUEST))/gi,
    explanation: "Commande système avec entrée utilisateur — injection de commande (RCE).",
    explanation_en: "System command with user input — command injection (RCE).",
  },
  {
    id: "new-function-eval",
    ruleId: "A05",
    regex: /new\s+Function\s*\(/g,
    explanation: "new Function() équivalent à eval() — risque d'exécution de code arbitraire.",
    explanation_en: "new Function() is equivalent to eval() — arbitrary code execution risk.",
  },
  {
    id: "eval-call",
    ruleId: "A05",
    regex: /\beval\s*\(/g,
    targetSide: "client",
    explanation: "Appel à eval() — exécute du code arbitraire et ouvre des failles d'injection.",
    explanation_en: "Call to eval() — executes arbitrary code and opens injection vulnerabilities.",
  },
  // XSS
  {
    id: "innerHTML-assign",
    ruleId: "A05",
    regex: /\.innerHTML\s*=/g,
    targetSide: "client",
    explanation: "Assignation à innerHTML — risque de XSS si la valeur provient d'une source non fiable.",
    explanation_en: "Assignment to innerHTML — XSS risk if the value comes from an untrusted source.",
  },
  {
    id: "dangerously-set-html",
    ruleId: "A05",
    regex: /dangerouslySetInnerHTML\s*=\s*\{\{/g,
    targetSide: "client",
    frameworks: ["react", "nextjs"],
    explanation: "Utilisation de dangerouslySetInnerHTML — risque de XSS, à éviter si possible.",
    explanation_en: "Use of dangerouslySetInnerHTML — XSS risk, avoid if possible.",
  },
  {
    id: "outerHTML-assign",
    ruleId: "A05",
    regex: /\.outerHTML\s*=/g,
    explanation: "Assignation à outerHTML — XSS, vecteur identique à innerHTML.",
    explanation_en: "Assignment to outerHTML — XSS, same vector as innerHTML.",
  },
  {
    id: "insertAdjacentHTML",
    ruleId: "A05",
    regex: /\.insertAdjacentHTML\s*\(/g,
    explanation: "insertAdjacentHTML() — peut injecter du HTML arbitraire, risque XSS.",
    explanation_en: "insertAdjacentHTML() — can inject arbitrary HTML, XSS risk.",
  },
  {
    id: "document-write",
    ruleId: "A05",
    regex: /document\.write\s*\(/g,
    targetSide: "client",
    explanation: "Appel à document.write() — peut injecter du HTML arbitraire et créer des failles XSS.",
    explanation_en: "Call to document.write() — can inject arbitrary HTML and create XSS vulnerabilities.",
  },
  // NoSQL Injection
  {
    id: "nosql-injection",
    ruleId: "A05",
    regex: /\$(?:where|regex|gt|lt|ne|in|nin|exists|elemMatch)\s*:\s*req\./gi,
    explanation: "Opérateur NoSQL (MongoDB) construit depuis une entrée utilisateur — injection NoSQL.",
    explanation_en: "NoSQL (MongoDB) operator built from user input — NoSQL injection.",
  },
  // LDAP Injection
  {
    id: "ldap-injection",
    ruleId: "A05",
    regex: /ldap(?:Search|Add|Modify|Delete)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
    explanation: "Requête LDAP construite avec des données utilisateur — injection LDAP.",
    explanation_en: "LDAP query built with user data — LDAP injection.",
  },
];
