import { analyzeCode } from "@/core/code-analyzer";

// ---------------------------------------------------------------------------
// A05 — Injection
// ---------------------------------------------------------------------------

describe("analyzeCode — A05 Injection", () => {
  it("détecte template literal SQL", () => {
    const code = "db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)";
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "sql-template-literal")).toBe(true);
    expect(result.detectedRuleIds).toContain("A05");
  });

  it("détecte eval()", () => {
    const code = "eval(userInput)";
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "eval-call")).toBe(true);
    expect(result.detectedRuleIds).toContain("A05");
  });

  it("détecte innerHTML =", () => {
    const code = "element.innerHTML = userContent;";
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "innerHTML-assign")).toBe(true);
    expect(result.detectedRuleIds).toContain("A05");
  });

  it("ne détecte rien sur une requête paramétrée propre", () => {
    const code = 'db.query("SELECT * FROM users WHERE id = ?", [req.params.id])';
    const result = analyzeCode(code);
    expect(result.matches.filter((m) => m.patternId === "sql-template-literal")).toHaveLength(0);
  });

  it("détecte interpolation PHP dans une chaîne SQL", () => {
    const code = '$query = "SELECT * FROM users WHERE id = $user_id";';
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "sql-php-interpolation")).toBe(true);
    expect(result.detectedRuleIds).toContain("A05");
  });

  it("détecte concaténation de variable dans SQL", () => {
    const code = '$query = "SELECT * FROM users WHERE id = " . $user_id;';
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.ruleId === "A05")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// A04 — Cryptographic Failures
// ---------------------------------------------------------------------------

describe("analyzeCode — A04 Crypto", () => {
  it("détecte Math.random() pour token", () => {
    const code = "const token = Math.random().toString(36);";
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "math-random-token")).toBe(true);
    expect(result.detectedRuleIds).toContain("A04");
  });

  it("détecte hardcoded secret", () => {
    const code = 'const secret = "mysupersecretvalue";';
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "hardcoded-secret")).toBe(true);
    expect(result.detectedRuleIds).toContain("A04");
  });

  it("ne détecte pas bcrypt", () => {
    const code = "const hash = await bcrypt.hash(password, 12);";
    const result = analyzeCode(code);
    expect(result.matches.filter((m) => m.ruleId === "A04")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// A07 — Authentication Failures
// ---------------------------------------------------------------------------

describe("analyzeCode — A07 Auth", () => {
  it("détecte credentials hardcodés", () => {
    const code = 'const username = "admin"; const password = "hunter2";';
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "hardcoded-credentials")).toBe(true);
    expect(result.detectedRuleIds).toContain("A07");
  });

  it("détecte jwt.sign sans expiresIn", () => {
    const code = 'const token = jwt.sign({ userId: user.id }, SECRET);';
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "jwt-no-expiry")).toBe(true);
    expect(result.detectedRuleIds).toContain("A07");
  });

  it("ne détecte pas jwt.sign avec expiresIn", () => {
    const code = 'const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });';
    const result = analyzeCode(code);
    expect(result.matches.filter((m) => m.patternId === "jwt-no-expiry")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// A02 — Security Misconfiguration
// ---------------------------------------------------------------------------

describe("analyzeCode — A02 Misconfiguration", () => {
  it("détecte CORS wildcard", () => {
    const code = "app.use(cors({ origin: '*' }));";
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "cors-wildcard")).toBe(true);
    expect(result.detectedRuleIds).toContain("A02");
  });
});

// ---------------------------------------------------------------------------
// A10 — Mishandling of Exceptional Conditions
// ---------------------------------------------------------------------------

describe("analyzeCode — A10 Exceptions", () => {
  it("détecte catch vide", () => {
    const code = "try { doSomething(); } catch (e) {}";
    const result = analyzeCode(code);
    expect(result.matches.some((m) => m.patternId === "empty-catch")).toBe(true);
    expect(result.detectedRuleIds).toContain("A10");
  });
});

// ---------------------------------------------------------------------------
// Structure du résultat
// ---------------------------------------------------------------------------

describe("analyzeCode — structure résultat", () => {
  it("detectedRuleIds dédupliqués", () => {
    // Two A05 patterns in one snippet
    const code = "eval(x); element.innerHTML = y;";
    const result = analyzeCode(code);
    const a05Count = result.detectedRuleIds.filter((id) => id === "A05").length;
    expect(a05Count).toBe(1);
  });

  it("numéros de ligne corrects", () => {
    const code = "const a = 1;\nconst b = 2;\neval(userInput);";
    const result = analyzeCode(code);
    const evalMatch = result.matches.find((m) => m.patternId === "eval-call");
    expect(evalMatch?.line).toBe(3);
  });

  it("snippet tronqué à 80 chars", () => {
    const longLine = "eval(" + "x".repeat(200) + ");";
    const result = analyzeCode(longLine);
    const evalMatch = result.matches.find((m) => m.patternId === "eval-call");
    expect(evalMatch).toBeDefined();
    expect(evalMatch!.snippet.length).toBeLessThanOrEqual(80);
  });

  it("code propre → matches vide", () => {
    const code = 'const hash = await bcrypt.hash(password, 12);\ndb.query("SELECT * FROM users WHERE id = ?", [id]);';
    const result = analyzeCode(code);
    expect(result.matches).toHaveLength(0);
    expect(result.detectedRuleIds).toHaveLength(0);
  });
});
