"use client";

import { useReducer, useCallback } from "react";
import type { AppState, Detection, OWASPRuleId, PromptOutput } from "@/core/types";
import { detect } from "@/core/detector";
import { getRulesForDomains } from "@/core/owasp-map";
import { getRulesByIds } from "@/core/constraints";
import { buildPrompt } from "@/core/prompt-builder";
import { OutputPanel } from "./OutputPanel";

// ---------------------------------------------------------------------------
// State & Reducer
// ---------------------------------------------------------------------------

const INITIAL_TOGGLES: Record<OWASPRuleId, boolean> = {
  A01: false,
  A02: false,
  A03: false,
  A04: false,
  A05: false,
  A07: false,
  A09: false,
};

type ExtendedState = AppState & {
  error: string | null;
  activeRuleIds: OWASPRuleId[];
};

const initialState: ExtendedState = {
  intention: "",
  detection: null,
  toggles: INITIAL_TOGGLES,
  output: null,
  isLoading: false,
  error: null,
  activeRuleIds: [],
};

type Action =
  | { type: "SET_INTENTION"; payload: string }
  | { type: "START_LOADING" }
  | {
      type: "SET_RESULT";
      detection: Detection;
      output: PromptOutput;
      ruleIds: OWASPRuleId[];
    }
  | { type: "SET_ERROR"; message: string };

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
        activeRuleIds: action.ruleIds,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, isLoading: false, error: action.message };
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
    const domains = detection.domain ? [detection.domain] : [];
    const ruleIds = getRulesForDomains(domains);
    const rules = getRulesByIds(ruleIds);
    const output = buildPrompt(state.intention, rules);

    dispatch({ type: "SET_RESULT", detection, output, ruleIds });
  }, [state.intention]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

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

        {/* Phase 4: <Toggles /> will be integrated here */}
        <div />

        <OutputPanel
          output={state.output}
          isLoading={state.isLoading}
          detection={state.detection}
          activeRules={new Set(state.activeRuleIds)}
        />
      </div>
    </main>
  );
}
