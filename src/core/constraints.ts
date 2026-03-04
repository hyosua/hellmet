import type { OWASPRule, OWASPRuleId } from "./types";
import rulesData from "../data/rules.json";

const rules = rulesData as OWASPRule[];

const rulesById: Map<OWASPRuleId, OWASPRule> = new Map(
  rules.map((r) => [r.id, r])
);

/**
 * Returns all OWASP rules from the knowledge base.
 */
export function getRules(): OWASPRule[] {
  return rules;
}

/**
 * Returns the constraint text for a given OWASP rule ID.
 * Returns an empty string if the rule is not found.
 */
export function getConstraint(id: OWASPRuleId): string {
  return rulesById.get(id)?.constraint ?? "";
}

/**
 * Returns the full OWASPRule objects for an array of rule IDs.
 * Preserves order and filters out unknown IDs.
 */
export function getRulesByIds(ids: OWASPRuleId[]): OWASPRule[] {
  return ids.flatMap((id) => {
    const rule = rulesById.get(id);
    return rule ? [rule] : [];
  });
}
