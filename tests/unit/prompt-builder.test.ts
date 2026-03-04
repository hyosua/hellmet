import { buildPrompt } from "@/core/prompt-builder";
import type { OWASPRule } from "@/core/types";

const mockRules: OWASPRule[] = [
  {
    id: "A01",
    name: "Access Control",
    severity: "critical",
    constraint: "Vérifier l'authentification avant toute action.",
    constraint_en: "Check authentication before any action.",
  },
  {
    id: "A04",
    name: "Insecure Design",
    severity: "high",
    constraint: "Valider le type MIME réel du fichier.",
    constraint_en: "Validate the real MIME type of the file.",
  },
];

describe("buildPrompt() — XML format", () => {
  it("contains <task> tag", () => {
    const result = buildPrompt("Crée une route Node.js", mockRules);
    expect(result).toContain("<task>");
    expect(result).toContain("</task>");
  });

  it("contains <security_constraints> tag", () => {
    const result = buildPrompt("Crée une route Node.js", mockRules);
    expect(result).toContain("<security_constraints>");
    expect(result).toContain("</security_constraints>");
  });

  it("contains <instructions> tag", () => {
    const result = buildPrompt("Crée une route Node.js", mockRules);
    expect(result).toContain("<instructions>");
    expect(result).toContain("</instructions>");
  });

  it("embeds the intention inside <task>", () => {
    const intention = "Crée une route Node.js pour l'upload";
    const result = buildPrompt(intention, mockRules);
    expect(result).toContain(intention);
  });

  it("includes all rule constraints inside <security_constraints>", () => {
    const result = buildPrompt("test", mockRules);
    expect(result).toContain("A01");
    expect(result).toContain("A04");
    expect(result).toContain("Vérifier l'authentification avant toute action.");
    expect(result).toContain("Valider le type MIME réel du fichier.");
  });
});

describe("buildPrompt() — severity ordering", () => {
  it("places critical rules before high before medium", () => {
    const rules: OWASPRule[] = [
      { id: "A09", name: "Logging", severity: "medium", constraint: "Log failures.", constraint_en: "Log failures." },
      { id: "A04", name: "Insecure Design", severity: "high", constraint: "Validate files.", constraint_en: "Validate files." },
      { id: "A01", name: "Access Control", severity: "critical", constraint: "Check auth.", constraint_en: "Check auth." },
    ];
    const result = buildPrompt("test", rules);
    const a01Pos = result.indexOf("A01");
    const a04Pos = result.indexOf("A04");
    const a09Pos = result.indexOf("A09");
    expect(a01Pos).toBeLessThan(a04Pos);
    expect(a04Pos).toBeLessThan(a09Pos);
  });
});

describe("buildPrompt() — empty rules case", () => {
  it("shows a no-constraints notice", () => {
    const result = buildPrompt("test intention", []);
    expect(result).toContain("<security_constraints>");
    expect(result).toContain("Aucune contrainte de sécurité spécifique");
  });

  it("still has all required structural sections even with no rules", () => {
    const result = buildPrompt("test", []);
    expect(result).toContain("<task>");
    expect(result).toContain("<instructions>");
  });
});
