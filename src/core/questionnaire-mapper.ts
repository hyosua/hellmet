import type { OWASPRuleId } from "./types";

export type AppType = "web" | "api" | "cli" | "mobile" | "other";

export interface QuestionnaireAnswers {
  description: string;
  appType: AppType;
  hasAuth: boolean;
  hasDatabase: boolean;
  hasFileUpload: boolean;
  hasSensitiveData: boolean;
  hasMultiUserRoles: boolean;
}

export const INITIAL_ANSWERS: QuestionnaireAnswers = {
  description: "",
  appType: "web",
  hasAuth: false,
  hasDatabase: false,
  hasFileUpload: false,
  hasSensitiveData: false,
  hasMultiUserRoles: false,
};

/**
 * Deterministically maps questionnaire answers to OWASP rule IDs.
 * No keyword detection — rules are derived directly from user-declared context.
 */
export function mapAnswersToRules(answers: QuestionnaireAnswers): OWASPRuleId[] {
  const rules = new Set<OWASPRuleId>();

  if (answers.hasAuth) {
    rules.add("A07"); // Authentication Failures
    rules.add("A04"); // Cryptographic Failures (passwords, tokens)
  }
  if (answers.hasDatabase) {
    rules.add("A05"); // Injection
  }
  if (answers.hasFileUpload) {
    rules.add("A06"); // Insecure Design
    rules.add("A08"); // Software and Data Integrity Failures
  }
  if (answers.hasSensitiveData) {
    rules.add("A04"); // Cryptographic Failures
  }
  if (answers.hasMultiUserRoles) {
    rules.add("A01"); // Broken Access Control
  }
  if (answers.appType === "web" || answers.appType === "api") {
    rules.add("A02"); // Security Misconfiguration (headers, CORS, secrets)
  }

  return Array.from(rules);
}
