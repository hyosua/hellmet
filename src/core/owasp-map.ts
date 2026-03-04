import type { DomainKey, OWASPRuleId } from "./types";

export const DOMAIN_MAP: Record<DomainKey, OWASPRuleId[]> = {
  auth: ["A02", "A07"],
  upload: ["A01", "A04"],
  database: ["A03"],
  api: ["A01", "A05"],
  frontend: ["A03", "A05"],
  crypto: ["A02"],
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
