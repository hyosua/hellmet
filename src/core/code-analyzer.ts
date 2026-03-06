import { VULNERABILITY_PATTERNS } from "../data/vulnerability-patterns";
import type { AnalysisContext, CodeAnalysisResult, VulnerabilityMatch } from "./types";

const DEFAULT_CONTEXT: AnalysisContext = {
  framework: null,
  frameworkSource: null,
  targetSide: "both",
  scaDependencies: null,
};

function patternMatchesContext(
  pattern: (typeof VULNERABILITY_PATTERNS)[number],
  context: AnalysisContext
): boolean {
  // Filter by target side
  if (context.targetSide !== "both" && pattern.targetSide && pattern.targetSide !== "both") {
    if (pattern.targetSide !== context.targetSide) return false;
  }

  // Filter by framework: if the pattern is framework-specific, only apply when framework matches
  if (pattern.frameworks && pattern.frameworks.length > 0 && context.framework) {
    if (!pattern.frameworks.includes(context.framework)) return false;
  }

  return true;
}

export function analyzeCode(
  code: string,
  context: AnalysisContext = DEFAULT_CONTEXT
): CodeAnalysisResult {
  const matches: VulnerabilityMatch[] = [];
  const lines = code.split("\n");

  for (const pattern of VULNERABILITY_PATTERNS) {
    if (!patternMatchesContext(pattern, context)) continue;

    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(code)) !== null) {
      if (pattern.validate && !pattern.validate(code, match.index, match.index + match[0].length)) {
        continue;
      }
      const line = code.slice(0, match.index).split("\n").length;
      const snippet = lines[line - 1]?.trim().slice(0, 80) ?? match[0].slice(0, 80);
      matches.push({
        ruleId: pattern.ruleId,
        patternId: pattern.id,
        line,
        snippet,
        explanation: pattern.explanation,
        explanation_en: pattern.explanation_en,
      });
    }
  }

  const detectedRuleIds = [...new Set(matches.map((m) => m.ruleId))];
  return { matches, detectedRuleIds };
}
