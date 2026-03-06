import { VULNERABILITY_PATTERNS } from "../data/vulnerability-patterns";
import type { CodeAnalysisResult, VulnerabilityMatch } from "./types";

export function analyzeCode(code: string): CodeAnalysisResult {
  const matches: VulnerabilityMatch[] = [];
  const lines = code.split("\n");

  for (const pattern of VULNERABILITY_PATTERNS) {
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
