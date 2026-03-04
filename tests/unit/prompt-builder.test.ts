import { buildPrompt } from "@/core/prompt-builder";
import type { OWASPRule } from "@/core/types";

const mockRules: OWASPRule[] = [
  {
    id: "A01",
    name: "Access Control",
    severity: "critical",
    constraint: "Vérifier l'authentification avant toute action.",
  },
  {
    id: "A04",
    name: "Insecure Design",
    severity: "high",
    constraint: "Valider le type MIME réel du fichier.",
  },
];

describe("buildPrompt() — Claude format (SC-004)", () => {
  it("contains <task> tag", () => {
    const { claude } = buildPrompt("Crée une route Node.js", mockRules);
    expect(claude).toContain("<task>");
    expect(claude).toContain("</task>");
  });

  it("contains <security_constraints> tag", () => {
    const { claude } = buildPrompt("Crée une route Node.js", mockRules);
    expect(claude).toContain("<security_constraints>");
    expect(claude).toContain("</security_constraints>");
  });

  it("contains <instructions> tag", () => {
    const { claude } = buildPrompt("Crée une route Node.js", mockRules);
    expect(claude).toContain("<instructions>");
    expect(claude).toContain("</instructions>");
  });

  it("embeds the intention inside <task>", () => {
    const intention = "Crée une route Node.js pour l'upload";
    const { claude } = buildPrompt(intention, mockRules);
    expect(claude).toContain(intention);
  });

  it("includes all rule constraints inside <security_constraints>", () => {
    const { claude } = buildPrompt("test", mockRules);
    expect(claude).toContain("A01");
    expect(claude).toContain("A04");
    expect(claude).toContain("Vérifier l'authentification avant toute action.");
    expect(claude).toContain("Valider le type MIME réel du fichier.");
  });
});

describe("buildPrompt() — GPT format (SC-005)", () => {
  it("contains ### Tâche section", () => {
    const { gpt } = buildPrompt("Crée une route Node.js", mockRules);
    expect(gpt).toContain("### Tâche");
  });

  it("contains ### Contraintes de sécurité obligatoires section", () => {
    const { gpt } = buildPrompt("Crée une route Node.js", mockRules);
    expect(gpt).toContain("### Contraintes de sécurité obligatoires");
  });

  it("contains instruction text at the end", () => {
    const { gpt } = buildPrompt("Crée une route Node.js", mockRules);
    expect(gpt).toContain("Tu es en mode audit strict");
  });

  it("embeds the intention in the Tâche section", () => {
    const intention = "Crée une route Node.js pour l'upload";
    const { gpt } = buildPrompt(intention, mockRules);
    expect(gpt).toContain(intention);
  });

  it("lists constraints as bullet points", () => {
    const { gpt } = buildPrompt("test", mockRules);
    expect(gpt).toContain("- [A01");
    expect(gpt).toContain("- [A04");
  });
});

describe("buildPrompt() — severity ordering", () => {
  it("places critical rules before high before medium in Claude output", () => {
    const rules: OWASPRule[] = [
      { id: "A09", name: "Logging", severity: "medium", constraint: "Log failures." },
      { id: "A04", name: "Insecure Design", severity: "high", constraint: "Validate files." },
      { id: "A01", name: "Access Control", severity: "critical", constraint: "Check auth." },
    ];
    const { claude } = buildPrompt("test", rules);
    const a01Pos = claude.indexOf("A01");
    const a04Pos = claude.indexOf("A04");
    const a09Pos = claude.indexOf("A09");
    expect(a01Pos).toBeLessThan(a04Pos);
    expect(a04Pos).toBeLessThan(a09Pos);
  });
});

describe("buildPrompt() — empty rules case", () => {
  it("shows a no-constraints notice in Claude format", () => {
    const { claude } = buildPrompt("test intention", []);
    expect(claude).toContain("<security_constraints>");
    expect(claude).toContain("Aucune contrainte de sécurité spécifique");
  });

  it("shows a no-constraints notice in GPT format", () => {
    const { gpt } = buildPrompt("test intention", []);
    expect(gpt).toContain("### Contraintes de sécurité obligatoires");
    expect(gpt).toContain("Aucune contrainte de sécurité spécifique");
  });

  it("still has all required structural sections even with no rules", () => {
    const { claude, gpt } = buildPrompt("test", []);
    expect(claude).toContain("<task>");
    expect(claude).toContain("<instructions>");
    expect(gpt).toContain("### Tâche");
    expect(gpt).toContain("Tu es en mode audit strict");
  });
});
