import type { DomainKey, OWASPRuleId } from "./types";

export const DOMAIN_MAP: Record<DomainKey, OWASPRuleId[]> = {
  auth:     ["A07", "A04"],                    // Auth Failures, Crypto Failures
  upload:   ["A06", "A01", "A08"],             // Insecure Design, Access Control, Integrity Failures
  database: ["A05"],                           // Injection
  api:      ["A01", "A05", "A06", "A08", "A10"], // Access Control, Injection, Insecure Design, Integrity, Exceptions
  frontend: ["A05", "A06"],                    // Injection (XSS), Insecure Design
  crypto:   ["A04"],                           // Crypto Failures
};

/**
 * Returns the deduplicated set of OWASP rule IDs for the given domain keys.
 */
export function getRulesForDomains(domains: DomainKey[]): OWASPRuleId[] {
  const seen = new Set<OWASPRuleId>();
  for (const domain of domains) {
    for (const ruleId of DOMAIN_MAP[domain]) {
      seen.add(ruleId);
    }
  }
  return Array.from(seen);
}
