export type OWASPRuleId =
  | "A01"
  | "A02"
  | "A03"
  | "A04"
  | "A05"
  | "A06"
  | "A07"
  | "A08"
  | "A09"
  | "A10";

export type Severity = "critical" | "high" | "medium";

export type DomainKey =
  | "api"
  | "auth"
  | "upload"
  | "database"
  | "frontend"
  | "crypto";

export interface OWASPRule {
  id: OWASPRuleId;
  name: string;
  constraint: string;
  constraint_en: string;
  severity: Severity;
}

export interface Detection {
  language: string | null;
  domains: DomainKey[];
  matchedKeywords: string[];
}

export type PromptOutput = string;

export interface AppState {
  intention: string;
  detection: Detection | null;
  toggles: Record<OWASPRuleId, boolean>;
  output: PromptOutput | null;
  isLoading: boolean;
}
