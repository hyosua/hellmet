import { parseDependencies, analyzeScaDependencies } from "@/core/sca-analyzer";

// ---------------------------------------------------------------------------
// parseDependencies
// ---------------------------------------------------------------------------

describe("parseDependencies", () => {
  it("parse dependencies et devDependencies", () => {
    const pkg = JSON.stringify({
      dependencies: { lodash: "^4.17.4", express: "4.18.0" },
      devDependencies: { jest: "^29.0.0" },
    });
    const deps = parseDependencies(pkg);
    expect(deps).toHaveLength(3);
    expect(deps.find((d) => d.name === "lodash")?.version).toBe("4.17.4");
    expect(deps.find((d) => d.name === "express")?.version).toBe("4.18.0");
    expect(deps.find((d) => d.name === "jest")?.version).toBe("29.0.0");
  });

  it("supprime les préfixes de version (^, ~)", () => {
    const pkg = JSON.stringify({ dependencies: { a: "^1.2.3", b: "~2.0.0", c: "3.0.0" } });
    const deps = parseDependencies(pkg);
    expect(deps.find((d) => d.name === "a")?.version).toBe("1.2.3");
    expect(deps.find((d) => d.name === "b")?.version).toBe("2.0.0");
    expect(deps.find((d) => d.name === "c")?.version).toBe("3.0.0");
  });

  it("retourne [] pour un JSON invalide", () => {
    expect(parseDependencies("not json")).toEqual([]);
    expect(parseDependencies("")).toEqual([]);
  });

  it("retourne [] si pas de sections dependencies", () => {
    const pkg = JSON.stringify({ name: "my-app", version: "1.0.0" });
    expect(parseDependencies(pkg)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// analyzeScaDependencies
// ---------------------------------------------------------------------------

describe("analyzeScaDependencies", () => {
  it("détecte lodash vulnérable (< 4.17.21)", () => {
    const deps = parseDependencies(JSON.stringify({ dependencies: { lodash: "4.17.4" } }));
    const result = analyzeScaDependencies(deps);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].packageName).toBe("lodash");
    expect(result.findings[0].issue).toBe("vulnerable");
    expect(result.findings[0].cveId).toBe("CVE-2021-23337");
    expect(result.checkedCount).toBe(1);
  });

  it("ne signale pas lodash à jour (4.17.21)", () => {
    const deps = parseDependencies(JSON.stringify({ dependencies: { lodash: "4.17.21" } }));
    const result = analyzeScaDependencies(deps);
    expect(result.findings).toHaveLength(0);
  });

  it("détecte moment comme déprécié (toute version)", () => {
    const deps = parseDependencies(JSON.stringify({ dependencies: { moment: "2.29.4" } }));
    const result = analyzeScaDependencies(deps);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].packageName).toBe("moment");
    expect(result.findings[0].issue).toBe("deprecated");
  });

  it("détecte event-stream 3.3.6 exactement (backdoor)", () => {
    const deps = parseDependencies(JSON.stringify({ dependencies: { "event-stream": "3.3.6" } }));
    const result = analyzeScaDependencies(deps);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].packageName).toBe("event-stream");
  });

  it("ne signale pas event-stream 3.3.4", () => {
    const deps = parseDependencies(JSON.stringify({ dependencies: { "event-stream": "3.3.4" } }));
    const result = analyzeScaDependencies(deps);
    expect(result.findings).toHaveLength(0);
  });

  it("détecte jsonwebtoken < 9.0.0", () => {
    const deps = parseDependencies(JSON.stringify({ dependencies: { jsonwebtoken: "8.5.1" } }));
    const result = analyzeScaDependencies(deps);
    expect(result.findings.some((f) => f.packageName === "jsonwebtoken")).toBe(true);
  });

  it("ne signale pas jsonwebtoken 9.0.0", () => {
    const deps = parseDependencies(JSON.stringify({ dependencies: { jsonwebtoken: "9.0.0" } }));
    const result = analyzeScaDependencies(deps);
    expect(result.findings.some((f) => f.packageName === "jsonwebtoken")).toBe(false);
  });

  it("checkedCount reflète le nombre total de dépendances", () => {
    const deps = parseDependencies(JSON.stringify({
      dependencies: { lodash: "4.17.4", react: "18.0.0", express: "4.20.0" },
    }));
    const result = analyzeScaDependencies(deps);
    expect(result.checkedCount).toBe(3);
  });

  it("retourne findings vide si aucune dépendance connue", () => {
    const deps = parseDependencies(JSON.stringify({ dependencies: { "my-private-lib": "1.0.0" } }));
    const result = analyzeScaDependencies(deps);
    expect(result.findings).toHaveLength(0);
    expect(result.checkedCount).toBe(1);
  });
});
