"use client";

import type { OWASPRuleId } from "@/core/types";
import { getRules } from "@/core/constraints";

type Lang = "fr" | "en";

interface TogglesProps {
  readonly activeToggles: Set<OWASPRuleId>;
  readonly autoDetected: Set<OWASPRuleId>;
  readonly onChange: (id: OWASPRuleId, active: boolean) => void;
  readonly lang?: Lang;
}

const rules = getRules();
const constraintMap = new Map(rules.map((r) => [r.id, { fr: r.constraint, en: r.constraint_en }]));
const TOGGLE_RULES = rules.map((r) => ({
  id: r.id,
  label_fr: `${r.id} ${r.name_fr}`,
  label_en: `${r.id} ${r.name}`,
}));

export function Toggles({ activeToggles, autoDetected, onChange, lang = "fr" }: TogglesProps) {
  const autoLabel = lang === "en" ? "auto-detected" : "détecté automatiquement";

  return (
    <fieldset className="flex flex-wrap gap-2" aria-label={lang === "en" ? "OWASP Rules" : "Règles OWASP"}>
      {TOGGLE_RULES.map(({ id, label_fr, label_en }) => {
        const isAuto = autoDetected.has(id);
        const isManual = activeToggles.has(id);
        const label = lang === "en" ? label_en : label_fr;
        const constraint = constraintMap.get(id)?.[lang === "en" ? "en" : "fr"];

        let state: "auto" | "manual" | "inactive" = "inactive";
        let stateClass = "border-muted text-muted bg-transparent hover:border-text hover:text-text";

        if(isAuto){
          state = "auto";
          stateClass = "border-accent bg-accent/20 text-accent cursor-default"
        }else if(isManual){
          state = "manual";
          stateClass = "border-accent bg-accent text-bg";
        }


        const ariaLabel = isAuto ? `${label} (${autoLabel})` : label;

        return (
          <div key={id} className="relative group">
            <button
              aria-pressed={isAuto || isManual}
              aria-label={ariaLabel}
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
    </fieldset>
  );
}
