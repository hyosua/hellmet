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
  name_fr: string;
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

export type AppMode = "intention" | "code";

export type Framework =
  | "react" | "nextjs" | "vue" | "angular" | "svelte"
  | "express" | "nestjs" | "django" | "flask" | "laravel"
  | "generic";

export type TargetSide = "client" | "server" | "both";

export interface AnalysisContext {
  framework: Framework | null;
  frameworkSource: "auto" | "manual" | null;
  targetSide: TargetSide;
  scaDependencies: ParsedDependency[] | null;
}

export interface ParsedDependency {
  name: string;
  version: string;
}

export interface ScaFinding {
  packageName: string;
  installedVersion: string;
  issue: "vulnerable" | "deprecated";
  affectedRange: string;
  title: string;
  cveId?: string;
  explanation: string;
  explanation_en: string;
}

export interface ScaResult {
  findings: ScaFinding[];
  checkedCount: number;
}

export interface VulnerabilityMatch {
  ruleId: OWASPRuleId;
  patternId: string;
  line: number;
  snippet: string;
  explanation: string;
  explanation_en: string;
}

export interface CodeAnalysisResult {
  matches: VulnerabilityMatch[];
  detectedRuleIds: OWASPRuleId[];
}
