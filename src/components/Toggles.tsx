"use client";

import type { OWASPRuleId } from "@/core/types";
import { getRules } from "@/core/constraints";

interface TogglesProps {
  activeToggles: Set<OWASPRuleId>;
  autoDetected: Set<OWASPRuleId>;
  onChange: (id: OWASPRuleId, active: boolean) => void;
}

const TOGGLE_RULES: { id: OWASPRuleId; label: string }[] = [
  { id: "A01", label: "A01 Access Control" },
  { id: "A02", label: "A02 Crypto" },
  { id: "A03", label: "A03 Injection" },
  { id: "A04", label: "A04 Insecure Design" },
  { id: "A06", label: "A06 Components" },
  { id: "A07", label: "A07 Auth" },
  { id: "A08", label: "A08 Integrity" },
  { id: "A09", label: "A09 Logging" },
  { id: "A10", label: "A10 SSRF" },
];

const constraintMap = new Map(getRules().map((r) => [r.id, r.constraint]));

export function Toggles({ activeToggles, autoDetected, onChange }: TogglesProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Règles OWASP">
      {TOGGLE_RULES.map(({ id, label }) => {
        const isAuto = autoDetected.has(id);
        const isManual = activeToggles.has(id);
        const constraint = constraintMap.get(id);

        const state: "auto" | "manual" | "inactive" = isAuto
          ? "auto"
          : isManual
          ? "manual"
          : "inactive";

        const stateClass =
          state === "auto"
            ? "border-[--color-accent] text-[--color-accent] opacity-75 cursor-default"
            : state === "manual"
            ? "border-[--color-accent] text-[--color-accent] bg-[--color-surface]"
            : "border-[--color-muted] text-[--color-muted] bg-transparent hover:border-[--color-text] hover:text-[--color-text]";

        return (
          <div key={id} className="relative group">
            <button
              aria-pressed={isAuto || isManual}
              aria-label={`${label}${isAuto ? " (détecté automatiquement)" : ""}`}
              aria-describedby={`tooltip-${id}`}
              disabled={isAuto}
              onClick={() => !isAuto && onChange(id, !isManual)}
              className={`px-2.5 py-1 rounded border text-xs font-mono transition-colors ${stateClass}`}
              data-state={state}
              title={constraint}
            >
              {label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
