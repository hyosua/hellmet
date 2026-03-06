import { SCA_ADVISORIES } from "../data/sca-advisories";
import type { ParsedDependency, ScaFinding, ScaResult } from "./types";

/**
 * Parses a package.json string and returns a flat list of dependencies.
 * Includes both `dependencies` and `devDependencies`.
 * Returns [] on parse error.
 */
export function parseDependencies(packageJsonStr: string): ParsedDependency[] {
  try {
    const pkg = JSON.parse(packageJsonStr) as Record<string, unknown>;
    const deps: ParsedDependency[] = [];

    for (const section of ["dependencies", "devDependencies"] as const) {
      const block = pkg[section];
      if (block && typeof block === "object") {
        for (const [name, version] of Object.entries(block as Record<string, string>)) {
          deps.push({ name, version: version.replace(/^[\^~>=<]/, "").trim() });
        }
      }
    }

    return deps;
  } catch {
    return [];
  }
}

/**
 * Compares two semver strings. Returns:
 *  -1 if a < b
 *   0 if a === b
 *   1 if a > b
 * Handles x.y.z format only (strips pre-release suffixes).
 */
function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const parse = (v: string) =>
    v.split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);

  const [aMaj, aMin, aPat] = parse(a);
  const [bMaj, bMin, bPat] = parse(b);

  if (aMaj !== bMaj) return aMaj < bMaj ? -1 : 1;
  if (aMin !== bMin) return aMin < bMin ? -1 : 1;
  if (aPat !== bPat) return aPat < bPat ? -1 : 1;
  return 0;
}

/**
 * Returns true if `installedVersion` satisfies the affected range.
 * Supported range formats: "< x.y.z", "= x.y.z", "any"
 */
function isAffected(installedVersion: string, affectedRange: string): boolean {
  if (affectedRange === "any") return true;
  const [op, rangeVer] = affectedRange.split(" ") as [string, string];
  const cmp = compareSemver(installedVersion, rangeVer);
  switch (op) {
    case "<": return cmp === -1;
    case "=": return cmp === 0;
    case "<=": return cmp <= 0;
    default: return false;
  }
}

/**
 * Checks a list of dependencies against the static advisory database.
 */
export function analyzeScaDependencies(deps: ParsedDependency[]): ScaResult {
  const findings: ScaFinding[] = [];

  for (const dep of deps) {
    const advisory = SCA_ADVISORIES.find((a) => a.package === dep.name);
    if (!advisory) continue;
    if (!isAffected(dep.version, advisory.affectedRange)) continue;

    findings.push({
      packageName: dep.name,
      installedVersion: dep.version,
      issue: advisory.issue,
      affectedRange: advisory.affectedRange,
      title: advisory.title,
      cveId: advisory.cveId,
      explanation: advisory.explanation,
      explanation_en: advisory.explanation_en,
    });
  }

  return { findings, checkedCount: deps.length };
}
