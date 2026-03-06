import type { Framework, OWASPRuleId, TargetSide } from "../../core/types";

export interface VulnerabilityPattern {
  id: string;
  ruleId: OWASPRuleId;
  regex: RegExp;
  explanation: string;
  explanation_en: string;
  targetSide?: TargetSide;      // default: "both"
  frameworks?: Framework[];     // if absent: all frameworks
  validate?: (code: string, matchStart: number, matchEnd: number) => boolean;
}
