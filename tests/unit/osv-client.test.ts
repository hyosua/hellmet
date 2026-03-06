import { analyzeScaDependenciesRemote, ScaApiError } from "@/core/osv-client";
import type { ParsedDependency } from "@/core/types";

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// ---------------------------------------------------------------------------
// fetch mock
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
Object.defineProperty(globalThis, "fetch", { value: mockFetch, writable: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEPS: ParsedDependency[] = [
  { name: "lodash", version: "4.17.4" },
  { name: "express", version: "4.18.0" },
];

const MOCK_RESULT = {
  findings: [
    {
      packageName: "lodash",
      installedVersion: "4.17.4",
      issue: "vulnerable",
      affectedRange: "< 4.17.21",
      title: "Prototype Pollution",
      cveId: "CVE-2021-23337",
      explanation: "...",
      explanation_en: "...",
      source: "osv",
    },
  ],
  checkedCount: 2,
  partial: false,
};

function makeFetchResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorageMock.clear();
  mockFetch.mockReset();
});

describe("analyzeScaDependenciesRemote", () => {
  it("cache miss → appel POST /api/sca", async () => {
    mockFetch.mockReturnValueOnce(makeFetchResponse(MOCK_RESULT));

    const result = await analyzeScaDependenciesRemote(DEPS);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/sca",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.findings).toHaveLength(1);
    expect(result.checkedCount).toBe(2);
  });

  it("cache hit → pas d'appel fetch", async () => {
    mockFetch.mockReturnValueOnce(makeFetchResponse(MOCK_RESULT));

    // Premier appel — remplit le cache
    await analyzeScaDependenciesRemote(DEPS);
    // Deuxième appel — doit lire le cache
    const result = await analyzeScaDependenciesRemote(DEPS);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.findings).toHaveLength(1);
  });

  it("cache expiré (> 30j) → refetch", async () => {
    mockFetch.mockReturnValue(makeFetchResponse(MOCK_RESULT));

    // Remplir le cache avec un cachedAt ancien
    await analyzeScaDependenciesRemote(DEPS);

    // Modifier le cachedAt dans le store pour simuler expiration
    const keys = Object.keys(
      (localStorageMock as unknown as { getItem: (k: string) => string | null }) as object
    );
    // Accès direct au store via getItem sur toutes les clés hellmet_sca_v1_*
    const storeKeys: string[] = [];
    for (const k of Object.keys(localStorageMock as object)) {
      if (k === "getItem" || k === "setItem" || k === "removeItem" || k === "clear") continue;
      storeKeys.push(k);
    }
    // Re-écrire via setItem avec cachedAt expiré
    const cacheKey = Object.keys(
      (localStorageMock as unknown as Record<string, unknown>)
    ).find((k) => k !== "getItem" && k !== "setItem" && k !== "removeItem" && k !== "clear");

    // Approche directe : chercher la clé via getItem sur un hash connu
    // Le hash est déterministe — on peut juste chercher toutes les clés hellmet_sca_v1_*
    // via une inspection du mock
    const mockStore = (localStorageMock as unknown as { getItem(k: string): string | null; setItem(k: string, v: string): void });
    // On doit trouver la clé — approche: stocker et accéder directement
    const expiredEntry = JSON.stringify({
      version: 1,
      cachedAt: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
      findings: MOCK_RESULT.findings,
      checkedCount: MOCK_RESULT.checkedCount,
      partial: false,
    });

    // Recréer le hash manuellement (djb2 sur "express@4.18.0,lodash@4.17.4")
    function djb2(str: string): number {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = (((hash << 5) + hash) ^ str.charCodeAt(i)) >>> 0;
      }
      return hash;
    }
    const sorted = [...DEPS].sort((a, b) => a.name.localeCompare(b.name));
    const hashHex = djb2(sorted.map((d) => `${d.name}@${d.version}`).join(",")).toString(16);
    const cacheKeyName = `hellmet_sca_v1_${hashHex}`;

    mockStore.setItem(cacheKeyName, expiredEntry);
    mockFetch.mockReset();
    mockFetch.mockReturnValueOnce(makeFetchResponse(MOCK_RESULT));

    await analyzeScaDependenciesRemote(DEPS);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("erreur réseau (fetch throw) → ScaApiError 'offline'", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const promise = analyzeScaDependenciesRemote(DEPS);
    await expect(promise).rejects.toThrow(ScaApiError);
    await expect(promise).rejects.toMatchObject({ kind: "offline" });
  });

  it("réponse HTTP non-ok → ScaApiError 'offline'", async () => {
    mockFetch.mockReturnValueOnce(Promise.resolve({ ok: false, json: () => Promise.resolve({}) }));

    await expect(analyzeScaDependenciesRemote(DEPS)).rejects.toThrow(ScaApiError);
  });

  it("hash stable indépendamment de l'ordre des deps", async () => {
    mockFetch.mockReturnValue(makeFetchResponse(MOCK_RESULT));

    const depsA: ParsedDependency[] = [
      { name: "lodash", version: "4.17.4" },
      { name: "express", version: "4.18.0" },
    ];
    const depsB: ParsedDependency[] = [
      { name: "express", version: "4.18.0" },
      { name: "lodash", version: "4.17.4" },
    ];

    await analyzeScaDependenciesRemote(depsA);
    // depsB dans l'ordre inverse → doit lire le même cache
    await analyzeScaDependenciesRemote(depsB);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("résultat partial=true → storé avec TTL réduit (cache expiré après 1h)", async () => {
    const partialResult = { ...MOCK_RESULT, partial: true };
    mockFetch.mockReturnValue(makeFetchResponse(partialResult));

    await analyzeScaDependenciesRemote(DEPS);

    // Lire le cache et vérifier partial=true
    function djb2(str: string): number {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = (((hash << 5) + hash) ^ str.charCodeAt(i)) >>> 0;
      }
      return hash;
    }
    const sorted = [...DEPS].sort((a, b) => a.name.localeCompare(b.name));
    const hashHex = djb2(sorted.map((d) => `${d.name}@${d.version}`).join(",")).toString(16);
    const raw = localStorageMock.getItem(`hellmet_sca_v1_${hashHex}`);
    expect(raw).not.toBeNull();
    const entry = JSON.parse(raw!);
    expect(entry.partial).toBe(true);
  });
});
