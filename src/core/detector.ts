import type { Detection, DomainKey } from "./types";

// ---------------------------------------------------------------------------
// Language keyword sets
// ---------------------------------------------------------------------------

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  Python: ["python", "django", "flask", "fastapi", "pip", "virtualenv", "py"],
  "Node.js": ["node", "nodejs", "node.js", "express", "npm", "require(", "module.exports"],
  JavaScript: ["javascript", "js", "vanilla js", "es6", "es2015", "webpack", "vite"],
  TypeScript: ["typescript", "ts", "tsx", "interface ", "type ", ": string", ": number", ": boolean"],
  SQL: ["sql", "select ", "insert ", "update ", "delete ", "join ", "where ", "from ", "table"],
  Go: ["golang", " go ", "goroutine", "func ", "package main", "go get"],
  Rust: ["rust", "cargo", "fn ", "let mut", "impl ", "struct ", "enum "],
  PHP: ["php", "<?php", "laravel", "symfony", "composer", "artisan"],
  Java: ["java", "spring", "maven", "gradle", "public class", "import java"],
  "C#": ["c#", "csharp", ".net", "dotnet", "asp.net", "nuget", "using system"],
  Bash: ["bash", "shell", "#!/bin/", "chmod", "grep ", "awk ", "sed ", "curl "],
};

// ---------------------------------------------------------------------------
// Domain keyword sets
// ---------------------------------------------------------------------------

const DOMAIN_KEYWORDS: Record<DomainKey, string[]> = {
  api: [
    "route", "endpoint", "rest", "api", "controller", "handler",
    "request", "response", "middleware", "http", "get /", "post /",
    "put /", "delete /", "patch /",
  ],
  auth: [
    "login", "logout", "authentification", "authentication", "auth",
    "jwt", "session", "token", "password", "oauth", "signup",
    "register", "credential", "mot de passe",
  ],
  upload: [
    "upload", "fichier", "file", "image", "multipart", "form-data",
    "storage", "s3", "bucket", "télécharger", "téléchargement",
  ],
  database: [
    "sql", "database", "db", "query", "select", "insert", "update",
    "delete", "orm", "prisma", "sequelize", "mongoose", "mongodb",
    "postgres", "mysql", "sqlite", "migration", "schema", "table",
  ],
  frontend: [
    "composant", "component", "form", "input", "ui", "render",
    "react", "vue", "angular", "html", "css", "dom", "button",
    "formulaire", "interface",
  ],
  crypto: [
    "chiffr", "hash", "encrypt", "decrypt", "bcrypt", "aes",
    "rsa", "sha", "hmac", "signature", "clé", "key", "secret",
    "cryptograph",
  ],
};

// ---------------------------------------------------------------------------
// Detection logic
// ---------------------------------------------------------------------------

/**
 * Detects the programming language and technical domain from free text.
 * Returns a Detection object with the best-matched language, domain (or null),
 * and the keywords that triggered the matches.
 */
export function detect(text: string): Detection {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  // --- Language detection: pick the language with the most keyword hits ---
  let bestLanguage: string | null = null;
  let bestLangScore = 0;

  for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score++;
        matched.push(kw);
      }
    }
    if (score > bestLangScore) {
      bestLangScore = score;
      bestLanguage = lang;
    }
  }

  // --- Domain detection: collect all domains with at least 1 keyword hit ---
  const matchedDomains: DomainKey[] = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [DomainKey, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score++;
        if (!matched.includes(kw)) matched.push(kw);
      }
    }
    if (score >= 1) {
      matchedDomains.push(domain);
    }
  }

  return {
    language: bestLangScore > 0 ? bestLanguage : null,
    domains: matchedDomains,
    matchedKeywords: [...new Set(matched)],
  };
}
