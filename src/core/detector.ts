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
    "put /", "delete /", "patch /", "graphql", "resolver", "gql","openapi", "swagger",
    "fetch(", "axios", "httpclient", "restify", "fastify", "hapi", "express", "spring", "django rest", "flask rest", "webapi",
    
  ],
  auth: [
    "login", "logout", "authentification", "authentication", "auth",
    "jwt", "session", "token", "password", "oauth", "signup",
    "register", "credential", "mot de passe", "hash", "bcrypt", "scrypt", "argon2",
    "passport", "devise", "warden", "identity", "claims", "refresh token",
    "authorization",
  ],
  upload: [
    "upload", "fichier", "file", "image", "multipart", "form-data",
    "storage", "s3", "bucket", "télécharger", "téléchargement",
  ],
  database: [
    "sql", "database", "db", "query", "select", "insert", "update",
    "delete", "orm", "prisma", "sequelize", "mongoose", "mongodb",
    "postgres", "mysql", "sqlite", "migration", "schema", "table", "bdd", "base de données",
    
  ],
  frontend: [
    "composant", "component", "form", "input", "ui", "render",
    "react", "vue", "angular", "html", "css", "dom", "button",
    "formulaire", "interface","vuejs", "svelte", "tailwind", "bootstrap", "material-ui",
    "frontend", "client-side", "navigateur", "browser", "css", "html", "jsx", "tsx",
  ],
  crypto: [
    "chiffr", "hash", "encrypt", "decrypt", "bcrypt", "aes",
    "rsa", "sha", "hmac", "signature", "clé", "key", "secret",
    "cryptograph", "cryptographie", "crypto", "openssl", "libsodium", "sodium", "crypto-js",
    "argon2", "scrypt", "pbkdf2", "hkdf", "key derivation","key exchange", "diffie-hellman",
    
  ],
};

// ---------------------------------------------------------------------------
// Keyword weights (high-signal terms score more than 1)
// ---------------------------------------------------------------------------

const KEYWORD_WEIGHTS: Record<string, number> = {
  jwt: 3,
  bcrypt: 3,
  oauth: 2,
  password: 2,
  "mot de passe": 2,
  upload: 2,
  s3: 2,
  "sql injection": 3,
  "form-data": 2,
  multipart: 2,
  encryption: 2,
  encrypt: 2,
  decrypt: 2,
  hmac: 2,
  prisma: 2,
  mongoose: 2,
};

// ---------------------------------------------------------------------------
// Detection logic
// ---------------------------------------------------------------------------

/**
 * Detects the best-matched programming language and collects matched keywords.
 */
function detectLanguage(
  lower: string,
  matched: string[]
): { language: string | null; score: number } {
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

  return { language: bestLanguage, score: bestLangScore };
}

/**
 * Detects domains with at least 1 keyword hit and collects matched keywords.
 */
function detectDomains(lower: string, matched: string[]): DomainKey[] {
  const matchedDomains: DomainKey[] = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [DomainKey, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += KEYWORD_WEIGHTS[kw.toLowerCase()] ?? 1;
        if (!matched.includes(kw)) matched.push(kw);
      }
    }
    if (score >= 1) {
      matchedDomains.push(domain);
    }
  }

  return matchedDomains;
}

/**
 * Detects the programming language and technical domain from free text.
 * Returns a Detection object with the best-matched language, domain (or null),
 * and the keywords that triggered the matches.
 */
export function detect(text: string): Detection {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  const { language, score: langScore } = detectLanguage(lower, matched);
  const domains = detectDomains(lower, matched);

  return {
    language: langScore > 0 ? language : null,
    domains,
    matchedKeywords: [...new Set(matched)],
  };
}
