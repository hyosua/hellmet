import {
  buildOsvQuery,
  extractAffectedRange,
  extractCveId,
  mapOsvResultToFindings,
  mergeStaticDeprecated,
} from "@/app/api/sca/route";
import type { ParsedDependency } from "@/core/types";

// ---------------------------------------------------------------------------
// extractAffectedRange
// ---------------------------------------------------------------------------

describe("extractAffectedRange", () => {
  it("retourne '< x.y.z' pour un range SEMVER avec fixed", () => {
    const ranges = [
      { type: "SEMVER", events: [{ introduced: "0" }, { fixed: "4.17.21" }] },
    ];
    expect(extractAffectedRange(ranges)).toBe("< 4.17.21");
  });

  it("retourne 'any' si pas de fixed dans les ranges SEMVER", () => {
    const ranges = [
      { type: "SEMVER", events: [{ introduced: "0" }] },
    ];
    expect(extractAffectedRange(ranges)).toBe("any");
  });

  it("ignore les ranges non-SEMVER", () => {
    const ranges = [
      { type: "ECOSYSTEM", events: [{ introduced: "0" }, { fixed: "1.0.0" }] },
    ];
    expect(extractAffectedRange(ranges)).toBe("any");
  });

  it("retourne 'any' pour tableau vide", () => {
    expect(extractAffectedRange([])).toBe("any");
  });

  it("prend le premier range SEMVER avec fixed si plusieurs", () => {
    const ranges = [
      { type: "SEMVER", events: [{ introduced: "0" }, { fixed: "1.2.3" }] },
      { type: "SEMVER", events: [{ introduced: "2.0.0" }, { fixed: "2.1.0" }] },
    ];
    expect(extractAffectedRange(ranges)).toBe("< 1.2.3");
  });
});

// ---------------------------------------------------------------------------
// extractCveId
// ---------------------------------------------------------------------------

describe("extractCveId", () => {
  it("retourne le premier alias CVE-*", () => {
    expect(extractCveId(["GHSA-abc-123", "CVE-2021-23337", "CVE-2021-99999"])).toBe("CVE-2021-23337");
  });

  it("retourne undefined si pas d'alias CVE-*", () => {
    expect(extractCveId(["GHSA-abc-123", "OSV-2021-001"])).toBeUndefined();
  });

  it("retourne undefined si aliases est undefined", () => {
    expect(extractCveId(undefined)).toBeUndefined();
  });

  it("retourne undefined si aliases est vide", () => {
    expect(extractCveId([])).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// mapOsvResultToFindings
// ---------------------------------------------------------------------------

describe("mapOsvResultToFindings", () => {
  const deps: ParsedDependency[] = [
    { name: "lodash", version: "4.17.4" },
    { name: "express", version: "4.18.0" },
    { name: "clean-pkg", version: "1.0.0" },
  ];

  it("mappe une réponse OSV complète en ScaFinding[]", () => {
    const results = [
      {
        vulns: [
          {
            id: "GHSA-xxx",
            aliases: ["CVE-2021-23337"],
            summary: "Prototype Pollution in lodash",
            details: "lodash before 4.17.21 is vulnerable. More details here.",
            affected: [
              { ranges: [{ type: "SEMVER", events: [{ introduced: "0" }, { fixed: "4.17.21" }] }] },
            ],
          },
        ],
      },
      { vulns: [] },
      {},
    ];

    const findings = mapOsvResultToFindings(deps, results);
    expect(findings).toHaveLength(1);
    expect(findings[0].packageName).toBe("lodash");
    expect(findings[0].installedVersion).toBe("4.17.4");
    expect(findings[0].issue).toBe("vulnerable");
    expect(findings[0].affectedRange).toBe("< 4.17.21");
    expect(findings[0].cveId).toBe("CVE-2021-23337");
    expect(findings[0].source).toBe("osv");
    expect(findings[0].title).toBe("Prototype Pollution in lodash");
  });

  it("retourne plusieurs findings si un package a plusieurs vulns OSV", () => {
    const singleDep: ParsedDependency[] = [{ name: "bad-pkg", version: "1.0.0" }];
    const results = [
      {
        vulns: [
          { id: "GHSA-aaa", aliases: ["CVE-2021-0001"], summary: "Vuln A", affected: [] },
          { id: "GHSA-bbb", aliases: ["CVE-2021-0002"], summary: "Vuln B", affected: [] },
        ],
      },
    ];
    const findings = mapOsvResultToFindings(singleDep, results);
    expect(findings).toHaveLength(2);
    expect(findings[0].cveId).toBe("CVE-2021-0001");
    expect(findings[1].cveId).toBe("CVE-2021-0002");
  });

  it("retourne [] si aucune vuln dans les résultats", () => {
    const results = [{}, {}, {}];
    expect(mapOsvResultToFindings(deps, results)).toHaveLength(0);
  });

  it("utilise l'id comme titre si summary absent", () => {
    const singleDep: ParsedDependency[] = [{ name: "pkg", version: "1.0.0" }];
    const results = [{ vulns: [{ id: "GHSA-fallback", affected: [] }] }];
    const findings = mapOsvResultToFindings(singleDep, results);
    expect(findings[0].title).toBe("GHSA-fallback");
  });
});

// ---------------------------------------------------------------------------
// mergeStaticDeprecated
// ---------------------------------------------------------------------------

describe("mergeStaticDeprecated", () => {
  it("ajoute les deprecated statiques non couverts par OSV", () => {
    const deps: ParsedDependency[] = [
      { name: "lodash", version: "4.17.4" },
      { name: "moment", version: "2.29.0" },
    ];
    const osvFindings = [
      {
        packageName: "lodash",
        installedVersion: "4.17.4",
        issue: "vulnerable" as const,
        affectedRange: "< 4.17.21",
        title: "Prototype Pollution",
        cveId: "CVE-2021-23337",
        explanation: "...",
        explanation_en: "...",
        source: "osv" as const,
      },
    ];

    const merged = mergeStaticDeprecated(osvFindings, deps);
    expect(merged).toHaveLength(2);
    const momentFinding = merged.find((f) => f.packageName === "moment");
    expect(momentFinding).toBeDefined();
    expect(momentFinding?.issue).toBe("deprecated");
    expect(momentFinding?.source).toBe("static");
  });

  it("ne duplique pas si OSV couvre déjà le package", () => {
    const deps: ParsedDependency[] = [{ name: "moment", version: "2.29.0" }];
    const osvFindings = [
      {
        packageName: "moment",
        installedVersion: "2.29.0",
        issue: "vulnerable" as const,
        affectedRange: "any",
        title: "Some OSV vuln",
        explanation: "...",
        explanation_en: "...",
        source: "osv" as const,
      },
    ];
    const merged = mergeStaticDeprecated(osvFindings, deps);
    // moment already in osvFindings, should not be added again
    expect(merged.filter((f) => f.packageName === "moment")).toHaveLength(1);
  });

  it("n'ajoute rien si aucun deprecated statique dans les deps", () => {
    const deps: ParsedDependency[] = [{ name: "lodash", version: "4.17.4" }];
    const osvFindings = [
      {
        packageName: "lodash",
        installedVersion: "4.17.4",
        issue: "vulnerable" as const,
        affectedRange: "< 4.17.21",
        title: "Prototype Pollution",
        explanation: "...",
        explanation_en: "...",
        source: "osv" as const,
      },
    ];
    const merged = mergeStaticDeprecated(osvFindings, deps);
    expect(merged).toHaveLength(1);
  });

  it("retourne les osvFindings inchangés si deps est vide", () => {
    const osvFindings = [
      {
        packageName: "lodash",
        installedVersion: "4.17.4",
        issue: "vulnerable" as const,
        affectedRange: "< 4.17.21",
        title: "Prototype Pollution",
        explanation: "...",
        explanation_en: "...",
        source: "osv" as const,
      },
    ];
    expect(mergeStaticDeprecated(osvFindings, [])).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// buildOsvQuery
// ---------------------------------------------------------------------------

describe("buildOsvQuery", () => {
  it("génère le payload querybatch correct", () => {
    const deps: ParsedDependency[] = [
      { name: "lodash", version: "4.17.4" },
      { name: "express", version: "4.18.0" },
    ];
    const query = buildOsvQuery(deps);
    expect(query.queries).toHaveLength(2);
    expect(query.queries[0]).toEqual({ package: { name: "lodash", ecosystem: "npm" }, version: "4.17.4" });
    expect(query.queries[1]).toEqual({ package: { name: "express", ecosystem: "npm" }, version: "4.18.0" });
  });
});
