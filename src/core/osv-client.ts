import type { ParsedDependency, ScaResult } from "./types";

// ---------------------------------------------------------------------------
// Hash
// ---------------------------------------------------------------------------

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (((hash << 5) + hash) ^ str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function hashDeps(deps: ParsedDependency[]): string {
  const sorted = [...deps].sort((a, b) => a.name.localeCompare(b.name));
  return djb2(sorted.map((d) => `${d.name}@${d.version}`).join(",")).toString(16);
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const CACHE_KEY_PREFIX = "hellmet_sca_v1_";
const TTL_FULL = 30 * 24 * 60 * 60 * 1000; // 30 days
const TTL_PARTIAL = 60 * 60 * 1000;         // 1 hour

interface CacheEntry {
  version: 1;
  cachedAt: number;
  findings: ScaResult["findings"];
  checkedCount: number;
  partial: boolean;
}

function readCache(hash: string): { result: ScaResult; partial: boolean } | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${hash}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    const ttl = entry.partial ? TTL_PARTIAL : TTL_FULL;
    if (Date.now() - entry.cachedAt > ttl) return null;
    return {
      result: { findings: entry.findings, checkedCount: entry.checkedCount, partial: entry.partial },
      partial: entry.partial,
    };
  } catch {
    return null;
  }
}

function writeCache(hash: string, result: ScaResult, partial: boolean): void {
  try {
    const entry: CacheEntry = {
      version: 1,
      cachedAt: Date.now(),
      findings: result.findings,
      checkedCount: result.checkedCount,
      partial,
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${hash}`, JSON.stringify(entry));
  } catch {
    // localStorage unavailable — silent fail
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class ScaApiError extends Error {
  constructor(public readonly kind: "offline" | "timeout") {
    super(`SCA API error: ${kind}`);
    this.name = "ScaApiError";
  }
}

export async function analyzeScaDependenciesRemote(
  deps: ParsedDependency[]
): Promise<ScaResult> {
  const hash = hashDeps(deps);

  const cached = readCache(hash);
  if (cached) return cached.result;

  let res: Response;
  try {
    res = await fetch("/api/sca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deps }),
    });
  } catch {
    throw new ScaApiError("offline");
  }

  if (!res.ok) {
    throw new ScaApiError("offline");
  }

  const data = (await res.json()) as {
    findings: ScaResult["findings"];
    checkedCount: number;
    partial?: boolean;
  };

  const partial = data.partial ?? false;
  const result: ScaResult = {
    findings: data.findings,
    checkedCount: data.checkedCount,
    partial,
  };

  writeCache(hash, result, partial);
  return result;
}
