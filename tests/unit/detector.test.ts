import { detect } from "@/core/detector";

describe("detect() — language detection", () => {
  it("detects Node.js", () => {
    const result = detect("Crée une route express en Node.js");
    expect(result.language).toBe("Node.js");
  });

  it("detects Python", () => {
    const result = detect("Écris une API Flask avec Python");
    expect(result.language).toBe("Python");
  });

  it("detects TypeScript", () => {
    const result = detect("Crée une interface TypeScript pour mon service");
    expect(result.language).toBe("TypeScript");
  });

  it("detects SQL", () => {
    const result = detect("Écris une requête SQL avec SELECT et JOIN");
    expect(result.language).toBe("SQL");
  });

  it("returns null language for unrecognized text", () => {
    const result = detect("Bonjour monde");
    expect(result.language).toBeNull();
  });
});

describe("detect() — domain detection", () => {
  it("detects api domain", () => {
    const result = detect("Crée un endpoint REST pour mon API");
    expect(result.domain).toBe("api");
  });

  it("detects auth domain", () => {
    const result = detect("Implémente un login avec JWT et session");
    expect(result.domain).toBe("auth");
  });

  it("detects upload domain", () => {
    const result = detect("Crée une route pour upload de fichiers image");
    expect(result.domain).toBe("upload");
  });

  it("detects database domain", () => {
    const result = detect("Écris une query SQL avec Prisma ORM");
    expect(result.domain).toBe("database");
  });

  it("detects frontend domain", () => {
    const result = detect("Crée un composant React avec un formulaire input");
    expect(result.domain).toBe("frontend");
  });

  it("detects crypto domain", () => {
    const result = detect("Hash le mot de passe avec bcrypt et chiffre les données");
    expect(result.domain).toBe("crypto");
  });

  it("returns null domain for unrecognized intention", () => {
    const result = detect("Bonjour monde");
    expect(result.domain).toBeNull();
  });
});

describe("detect() — combined detection", () => {
  it("detects both language and domain from spec example", () => {
    const result = detect(
      "Crée une route d'api pour uploader des images en Node"
    );
    // Should detect Node.js as language
    expect(result.language).toBe("Node.js");
    // Should detect either upload or api — both are valid, upload wins due to "uploader" keyword
    expect(result.domain).not.toBeNull();
  });

  it("populates matchedKeywords with detected terms", () => {
    const result = detect("route express Node.js JWT");
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
  });

  it("returns deduplicated matchedKeywords", () => {
    const result = detect("jwt jwt jwt auth auth");
    const unique = new Set(result.matchedKeywords);
    expect(unique.size).toBe(result.matchedKeywords.length);
  });
});
