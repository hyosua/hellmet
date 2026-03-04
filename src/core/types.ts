export type OWASPRuleId = "A01" | "A02" | "A03" | "A04" | "A05" | "A07" | "A09";

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
}

export interface Detection {
  language: string | null;
  domains: DomainKey[];
  matchedKeywords: string[];
}

export interface PromptOutput {
  claude: string;
  gpt: string;
}

export interface AppState {
  intention: string;
  detection: Detection | null;
  toggles: Record<OWASPRuleId, boolean>;
  output: PromptOutput | null;
  isLoading: boolean;
}
