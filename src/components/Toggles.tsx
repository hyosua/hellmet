"use client";

import type { OWASPRuleId } from "@/core/types";
import { getRules } from "@/core/constraints";

type Lang = "fr" | "en";

interface TogglesProps {
  activeToggles: Set<OWASPRuleId>;
  autoDetected: Set<OWASPRuleId>;
  onChange: (id: OWASPRuleId, active: boolean) => void;
  lang?: Lang;
}

const TOGGLE_RULES: { id: OWASPRuleId; label_fr: string; label_en: string }[] = [
  { id: "A01", label_fr: "A01 Contrôle d'accès", label_en: "A01 Access Control" },
  { id: "A02", label_fr: "A02 Cryptographie",    label_en: "A02 Crypto" },
  { id: "A03", label_fr: "A03 Injection",        label_en: "A03 Injection" },
  { id: "A04", label_fr: "A04 Conception",       label_en: "A04 Insecure Design" },
  { id: "A06", label_fr: "A06 Composants",       label_en: "A06 Components" },
  { id: "A07", label_fr: "A07 Authentification", label_en: "A07 Auth" },
  { id: "A08", label_fr: "A08 Intégrité",        label_en: "A08 Integrity" },
  { id: "A09", label_fr: "A09 Journalisation",   label_en: "A09 Logging" },
  { id: "A10", label_fr: "A10 SSRF",             label_en: "A10 SSRF" },
];

const rules = getRules();
const constraintMap = new Map(rules.map((r) => [r.id, { fr: r.constraint, en: r.constraint_en }]));

export function Toggles({ activeToggles, autoDetected, onChange, lang = "fr" }: TogglesProps) {
  const autoLabel = lang === "en" ? "auto-detected" : "détecté automatiquement";

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={lang === "en" ? "OWASP Rules" : "Règles OWASP"}>
      {TOGGLE_RULES.map(({ id, label_fr, label_en }) => {
        const isAuto = autoDetected.has(id);
        const isManual = activeToggles.has(id);
        const label = lang === "en" ? label_en : label_fr;
        const constraint = constraintMap.get(id)?.[lang === "en" ? "en" : "fr"];

        const state: "auto" | "manual" | "inactive" = isAuto
          ? "auto"
          : isManual
          ? "manual"
          : "inactive";

        const stateClass =
          state === "auto"
            ? "border-accent bg-accent/20 text-accent cursor-default"
            : state === "manual"
            ? "border-accent bg-accent text-bg"
            : "border-muted text-muted bg-transparent hover:border-text hover:text-text";

        return (
          <div key={id} className="relative group">
            <button
              aria-pressed={isAuto || isManual}
              aria-label={`${label}${isAuto ? ` (${autoLabel})` : ""}`}
              aria-describedby={constraint ? `tooltip-${id}` : undefined}
              disabled={isAuto}
              onClick={() => !isAuto && onChange(id, !isManual)}
              className={`px-2.5 py-1 rounded border text-xs font-mono transition-colors ${stateClass}`}
              data-state={state}
              title={constraint}
            >
              {label}
            </button>
            {constraint && (
              <span id={`tooltip-${id}`} className="sr-only">
                {constraint}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
