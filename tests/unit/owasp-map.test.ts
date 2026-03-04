import { DOMAIN_MAP, getRulesForDomains } from "@/core/owasp-map";

describe("DOMAIN_MAP — mapping table", () => {
  it("maps auth to A02 and A07", () => {
    expect(DOMAIN_MAP.auth).toEqual(expect.arrayContaining(["A02", "A07"]));
    expect(DOMAIN_MAP.auth).toHaveLength(2);
  });

  it("maps upload to A01, A04 and A08", () => {
    expect(DOMAIN_MAP.upload).toEqual(expect.arrayContaining(["A01", "A04", "A08"]));
    expect(DOMAIN_MAP.upload).toHaveLength(3);
  });

  it("maps database to A03", () => {
    expect(DOMAIN_MAP.database).toEqual(["A03"]);
  });

  it("maps api to A01, A05, A06, A08 and A10", () => {
    expect(DOMAIN_MAP.api).toEqual(
      expect.arrayContaining(["A01", "A05", "A06", "A08", "A10"])
    );
    expect(DOMAIN_MAP.api).toHaveLength(5);
  });

  it("maps frontend to A03, A05 and A06", () => {
    expect(DOMAIN_MAP.frontend).toEqual(
      expect.arrayContaining(["A03", "A05", "A06"])
    );
    expect(DOMAIN_MAP.frontend).toHaveLength(3);
  });

  it("maps crypto to A02", () => {
    expect(DOMAIN_MAP.crypto).toEqual(["A02"]);
  });
});

describe("getRulesForDomains()", () => {
  it("returns correct rules for a single domain", () => {
    const rules = getRulesForDomains(["auth"]);
    expect(rules).toEqual(expect.arrayContaining(["A02", "A07"]));
  });

  it("returns deduplicated rules for overlapping domains", () => {
    // api → A01, A05, A06, A08, A10 | upload → A01, A04, A08 — A01 and A08 appear in both
    const rules = getRulesForDomains(["api", "upload"]);
    const unique = new Set(rules);
    expect(unique.size).toBe(rules.length);
    expect(rules).toContain("A01");
    expect(rules).toContain("A04");
    expect(rules).toContain("A05");
    expect(rules).toContain("A08");
    expect(rules).toContain("A10");
  });

  it("returns empty array for empty domain list", () => {
    expect(getRulesForDomains([])).toEqual([]);
  });

  it("handles multiple domains without duplicates (auth + crypto, both have A02)", () => {
    const rules = getRulesForDomains(["auth", "crypto"]);
    const a02Count = rules.filter((r) => r === "A02").length;
    expect(a02Count).toBe(1);
  });

  it("includes new rules A06, A08, A10 for api domain", () => {
    const rules = getRulesForDomains(["api"]);
    expect(rules).toContain("A06");
    expect(rules).toContain("A08");
    expect(rules).toContain("A10");
  });

  it("includes A08 for upload domain", () => {
    const rules = getRulesForDomains(["upload"]);
    expect(rules).toContain("A08");
  });

  it("includes A06 for frontend domain", () => {
    const rules = getRulesForDomains(["frontend"]);
    expect(rules).toContain("A06");
  });
});
