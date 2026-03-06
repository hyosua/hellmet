import type { NextRequest } from "next/server";
import type { ParsedDependency, ScaFinding } from "@/core/types";
import { SCA_ADVISORIES } from "@/data/sca-advisories";

export const runtime = "nodejs";
export const maxDuration = 15;

// ---------------------------------------------------------------------------
// OSV types
// ---------------------------------------------------------------------------

interface OsvRange {
  type: string;
  events: Array<{ introduced?: string; fixed?: string }>;
}

interface OsvVuln {
  id: string;
  aliases?: string[];
  summary?: string;
  details?: string;
  affected?: Array<{ ranges?: OsvRange[] }>;
}

interface OsvResult {
  vulns?: OsvVuln[];
}

// ---------------------------------------------------------------------------
// Pure functions (testable)
// ---------------------------------------------------------------------------

export function buildOsvQuery(deps: ParsedDependency[]) {
  return {
    queries: deps.map((d) => ({
      package: { name: d.name, ecosystem: "npm" },
      version: d.version,
    })),
  };
}

export function extractAffectedRange(ranges: OsvRange[]): string {
  for (const range of ranges) {
    if (range.type === "SEMVER") {
      const fixed = range.events.find((e) => e.fixed !== undefined)?.fixed;
      if (fixed) return `< ${fixed}`;
    }
  }
  return "any";
}

export function extractCveId(aliases?: string[]): string | undefined {
  return aliases?.find((a) => a.startsWith("CVE-"));
}

export function mapOsvResultToFindings(
  deps: ParsedDependency[],
  results: OsvResult[]
): ScaFinding[] {
  const findings: ScaFinding[] = [];
  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i];
    const result = results[i];
    if (!result?.vulns?.length) continue;

    for (const vuln of result.vulns) {
      const allRanges = vuln.affected?.flatMap((a) => a.ranges ?? []) ?? [];
      const affectedRange = extractAffectedRange(allRanges);
      const summary = vuln.summary ?? vuln.id;
      const firstSentence = vuln.details?.split(/\.\s/)[0];
      const explanation = firstSentence ? `${summary}. ${firstSentence}.` : summary;

      findings.push({
        packageName: dep.name,
        installedVersion: dep.version,
        issue: "vulnerable",
        affectedRange,
        title: summary,
        cveId: extractCveId(vuln.aliases),
        explanation,
        explanation_en: explanation,
        source: "osv",
      });
    }
  }
  return findings;
}

export function mergeStaticDeprecated(
  osvFindings: ScaFinding[],
  deps: ParsedDependency[]
): ScaFinding[] {
  const deprecatedAdvisories = SCA_ADVISORIES.filter((a) => a.issue === "deprecated");
  const osvPackageNames = new Set(osvFindings.map((f) => f.packageName));
  const extra: ScaFinding[] = [];

  for (const dep of deps) {
    if (osvPackageNames.has(dep.name)) continue;
    const advisory = deprecatedAdvisories.find((a) => a.package === dep.name);
    if (!advisory) continue;
    extra.push({
      packageName: dep.name,
      installedVersion: dep.version,
      issue: "deprecated",
      affectedRange: advisory.affectedRange,
      title: advisory.title,
      cveId: advisory.cveId,
      explanation: advisory.explanation,
      explanation_en: advisory.explanation_en,
      source: "static",
    });
  }

  return [...osvFindings, ...extra];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getStaticFindings(deps: ParsedDependency[]): ScaFinding[] {
  const findings: ScaFinding[] = [];
  for (const dep of deps) {
    const advisory = SCA_ADVISORIES.find((a) => a.package === dep.name);
    if (!advisory) continue;
    findings.push({
      packageName: dep.name,
      installedVersion: dep.version,
      issue: advisory.issue,
      affectedRange: advisory.affectedRange,
      title: advisory.title,
      cveId: advisory.cveId,
      explanation: advisory.explanation,
      explanation_en: advisory.explanation_en,
      source: "static",
    });
  }
  return findings;
}

async function callOsv(
  body: ReturnType<typeof buildOsvQuery>,
  signal: AbortSignal
): Promise<OsvResult[]> {
  const res = await fetch("https://api.osv.dev/v1/querybatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`OSV returned ${res.status}`);
  const data = (await res.json()) as { results: OsvResult[] };
  return data.results;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { deps } = body as { deps?: ParsedDependency[] };

  if (!Array.isArray(deps)) {
    return Response.json({ error: "deps must be an array" }, { status: 400 });
  }
  if (deps.length > 500) {
    return Response.json({ error: "Too many deps (max 500)" }, { status: 400 });
  }
  if (deps.length === 0) {
    return Response.json({ findings: [], checkedCount: 0, partial: false });
  }

  const osvQuery = buildOsvQuery(deps);

  // Layer 1: Try OSV with 1 automatic retry
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const results = await callOsv(osvQuery, controller.signal);
      clearTimeout(timeout);
      const osvFindings = mapOsvResultToFindings(deps, results);
      const findings = mergeStaticDeprecated(osvFindings, deps);
      return Response.json(
        { findings, checkedCount: deps.length, partial: false },
        { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
      );
    } catch {
      clearTimeout(timeout);
      // retry once, then fall through to degraded response
    }
  }

  // Layer 2: Degraded response with static findings
  const staticFindings = getStaticFindings(deps);
  return Response.json({
    findings: staticFindings,
    checkedCount: deps.length,
    partial: true,
    reason: "osv_unavailable",
  });
}
