"use client";

import { useReducer, useCallback } from "react";
import type { AppState, Detection, OWASPRuleId, PromptOutput } from "@/core/types";
import { detect } from "@/core/detector";
import { getRulesForDomains } from "@/core/owasp-map";
import { getRulesByIds } from "@/core/constraints";
import { buildPrompt } from "@/core/prompt-builder";
import { OutputPanel } from "./OutputPanel";
import { Toggles } from "./Toggles";

// ---------------------------------------------------------------------------
// State & Reducer
// ---------------------------------------------------------------------------

const INITIAL_TOGGLES: Record<OWASPRuleId, boolean> = {
  A01: false,
  A02: false,
  A03: false,
  A04: false,
  A05: false,
  A06: false,
  A07: false,
  A08: false,
  A09: false,
  A10: false,
};

type ExtendedState = AppState & {
  error: string | null;
  autoRuleIds: OWASPRuleId[];
};

const initialState: ExtendedState = {
  intention: "",
  detection: null,
  toggles: INITIAL_TOGGLES,
  output: null,
  isLoading: false,
  error: null,
  autoRuleIds: [],
};

type Action =
  | { type: "SET_INTENTION"; payload: string }
  | { type: "START_LOADING" }
  | {
      type: "SET_RESULT";
      detection: Detection;
      output: PromptOutput;
      autoRuleIds: OWASPRuleId[];
    }
  | { type: "SET_ERROR"; message: string }
  | { type: "TOGGLE_RULE"; id: OWASPRuleId; active: boolean };

function effectiveRuleIds(
  autoRuleIds: OWASPRuleId[],
  toggles: Record<OWASPRuleId, boolean>
): OWASPRuleId[] {
  const manualIds = (Object.entries(toggles) as [OWASPRuleId, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k);
  return [...new Set([...autoRuleIds, ...manualIds])];
}

function reducer(state: ExtendedState, action: Action): ExtendedState {
  switch (action.type) {
    case "SET_INTENTION":
      return { ...state, intention: action.payload, error: null };
    case "START_LOADING":
      return { ...state, isLoading: true, error: null };
    case "SET_RESULT":
      return {
        ...state,
        isLoading: false,
        detection: action.detection,
        output: action.output,
        autoRuleIds: action.autoRuleIds,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, isLoading: false, error: action.message };
    case "TOGGLE_RULE": {
      const newToggles = { ...state.toggles, [action.id]: action.active };
      if (!state.output || !state.intention.trim()) {
        return { ...state, toggles: newToggles };
      }
      const allIds = effectiveRuleIds(state.autoRuleIds, newToggles);
      const rules = getRulesByIds(allIds);
      const output = buildPrompt(state.intention, rules);
      return { ...state, toggles: newToggles, output };
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SingleBox() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSubmit = useCallback(() => {
    if (!state.intention.trim()) {
      dispatch({ type: "SET_ERROR", message: "L'intention ne peut pas être vide." });
      return;
    }

    dispatch({ type: "START_LOADING" });

    const detection = detect(state.intention);
    const autoRuleIds = getRulesForDomains(detection.domains);
    const allIds = effectiveRuleIds(autoRuleIds, state.toggles);
    const rules = getRulesByIds(allIds);
    const output = buildPrompt(state.intention, rules);

    dispatch({ type: "SET_RESULT", detection, output, autoRuleIds });
  }, [state.intention, state.toggles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleToggle = useCallback((id: OWASPRuleId, active: boolean) => {
    dispatch({ type: "TOGGLE_RULE", id, active });
  }, []);

  const autoDetected = new Set(state.autoRuleIds);
  const manualToggles = new Set(
    (Object.entries(state.toggles) as [OWASPRuleId, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k)
  );
  const activeRules = new Set(effectiveRuleIds(state.autoRuleIds, state.toggles));

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight text-[--color-accent]">
          Hellmet
        </h1>

        <div className="flex flex-col gap-2">
          <textarea
            value={state.intention}
            onChange={(e) =>
              dispatch({ type: "SET_INTENTION", payload: e.target.value })
            }
            onKeyDown={handleKeyDown}
            placeholder="Décris ce que tu veux coder…"
            rows={4}
            className="w-full rounded-md bg-[--color-surface] text-[--color-text] font-mono text-sm p-3 resize-y outline-hidden border border-[--color-muted] focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent] placeholder:text-[--color-muted]"
            aria-label="Intention de code"
          />

          {state.error && (
            <p className="text-red-400 text-xs" role="alert">
              {state.error}
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={state.isLoading}
          className="self-start px-4 py-2 rounded-md bg-[--color-accent] text-[--color-bg] font-mono font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          aria-label="Générer le prompt sécurisé"
        >
          → Run
        </button>

        <Toggles
          activeToggles={manualToggles}
          autoDetected={autoDetected}
          onChange={handleToggle}
        />

        <OutputPanel
          output={state.output}
          isLoading={state.isLoading}
          detection={state.detection}
          activeRules={activeRules}
          intention={state.intention}
        />
      </div>
    </main>
  );
}
