"use client";

import { useReducer, useCallback, useState, useEffect } from "react";
import type { AppState, Detection, OWASPRuleId, PromptOutput } from "@/core/types";
import { detect } from "@/core/detector";
import { getRulesForDomains } from "@/core/owasp-map";
import { getRulesByIds } from "@/core/constraints";
import { buildPrompt } from "@/core/prompt-builder";
import { OutputPanel } from "./OutputPanel";
import { Toggles } from "./Toggles";
import { ThemeToggle } from "./ThemeToggle";

// ---------------------------------------------------------------------------
// UI Labels
// ---------------------------------------------------------------------------

const UI = {
  fr: {
    subtitle: "Ajoutez un contexte de sécurité à vos prompts llm.",
    placeholder: "Ex : route API Node.js pour uploader des images avec JWT",
    ariaTextarea: "Intention de code",
    errorEmpty: "L'intention ne peut pas être vide. — Immanuel Hackant",
    historyBtn: (n: number, open: boolean) => `${open ? "✕" : "⏱"} Historique (${n})`,
    ariaLang: "Langue de sortie",
    clear: "✕ Clear",
    ariaClear: "Effacer tout",
    run: "→ Run",
    ariaRun: "Générer le prompt sécurisé (Entrée)",
    owaspLabel: "Règles OWASP",
    owaspTooltip: "OWASP Top 10 — liste des vulnérabilités web les plus critiques. Chaque règle correspond à une catégorie de risque (injection, auth, accès…).",
    owaspDesc: "— détectées selon ton code, activables manuellement.",
    resetToggles: "Tout désactiver",
    locale: "fr-FR" as const,
  },
  en: {
    subtitle: "Add a security context before asking AI.",
    placeholder: "Ex: Node.js API route to upload images with JWT",
    ariaTextarea: "Code intention",
    errorEmpty: "Intention cannot be empty. — Immanuel Hackant",
    historyBtn: (n: number, open: boolean) => `${open ? "✕" : "⏱"} History (${n})`,
    ariaLang: "Output language",
    clear: "✕ Clear",
    ariaClear: "Clear all",
    run: "→ Run",
    ariaRun: "Generate secure prompt (Enter)",
    owaspLabel: "OWASP Rules",
    owaspTooltip: "OWASP Top 10 — the most critical web vulnerability categories. Each rule maps to a risk type (injection, auth, access…).",
    owaspDesc: "— detected from your code, can be toggled manually.",
    resetToggles: "Disable all",
    locale: "en-US" as const,
  },
} as const;

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

interface HistoryEntry {
  intention: string;
  output: PromptOutput;
  detection: Detection;
  autoRuleIds: OWASPRuleId[];
  timestamp: number;
}

const HISTORY_KEY = "hellmet_history";
const MAX_HISTORY = 5;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {}
}

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

type Lang = "fr" | "en";

type ExtendedState = AppState & {
  error: string | null;
  autoRuleIds: OWASPRuleId[];
  lang: Lang;
};

const initialState: ExtendedState = {
  intention: "",
  detection: null,
  toggles: INITIAL_TOGGLES,
  output: null,
  isLoading: false,
  error: null,
  autoRuleIds: [],
  lang: "fr",
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
  | { type: "TOGGLE_RULE"; id: OWASPRuleId; active: boolean }
  | { type: "RESET_TOGGLES" }
  | { type: "SET_LANG"; lang: Lang }
  | { type: "CLEAR" };

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
    case "CLEAR":
      return initialState;
    case "TOGGLE_RULE": {
      const newToggles = { ...state.toggles, [action.id]: action.active };
      if (!state.output || !state.intention.trim()) {
        return { ...state, toggles: newToggles };
      }
      const allIds = effectiveRuleIds(state.autoRuleIds, newToggles);
      const rules = getRulesByIds(allIds);
      const output = buildPrompt(state.intention, rules, state.lang);
      return { ...state, toggles: newToggles, output };
    }
    case "RESET_TOGGLES": {
      if (!state.output || !state.intention.trim()) {
        return { ...state, toggles: INITIAL_TOGGLES };
      }
      const allIds = effectiveRuleIds(state.autoRuleIds, INITIAL_TOGGLES);
      const rules = getRulesByIds(allIds);
      const output = buildPrompt(state.intention, rules, state.lang);
      return { ...state, toggles: INITIAL_TOGGLES, output };
    }
    case "SET_LANG": {
      if (!state.output || !state.intention.trim()) {
        return { ...state, lang: action.lang };
      }
      const allIds = effectiveRuleIds(state.autoRuleIds, state.toggles);
      const rules = getRulesByIds(allIds);
      const output = buildPrompt(state.intention, rules, action.lang);
      return { ...state, lang: action.lang, output };
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Persist history when a new result is generated
  useEffect(() => {
    if (!state.output || !state.detection || !state.intention.trim()) return;
    const entry: HistoryEntry = {
      intention: state.intention,
      output: state.output,
      detection: state.detection,
      autoRuleIds: state.autoRuleIds,
      timestamp: Date.now(),
    };
    setHistory((prev) => {
      const next = [
        entry,
        ...prev.filter((e) => e.intention !== state.intention),
      ].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.output]);

  const handleSubmit = useCallback(() => {
    if (!state.intention.trim()) {
      dispatch({ type: "SET_ERROR", message: UI[state.lang].errorEmpty });
      return;
    }

    dispatch({ type: "START_LOADING" });

    const detection = detect(state.intention);
    const autoRuleIds = getRulesForDomains(detection.domains);
    const allIds = effectiveRuleIds(autoRuleIds, state.toggles);
    const rules = getRulesByIds(allIds);
    const output = buildPrompt(state.intention, rules, state.lang);

    dispatch({ type: "SET_RESULT", detection, output, autoRuleIds });
  }, [state.intention, state.toggles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleToggle = useCallback((id: OWASPRuleId, active: boolean) => {
    dispatch({ type: "TOGGLE_RULE", id, active });
  }, []);

  const handleRestoreHistory = useCallback((entry: HistoryEntry) => {
    dispatch({ type: "SET_INTENTION", payload: entry.intention });
    dispatch({
      type: "SET_RESULT",
      detection: entry.detection,
      output: entry.output,
      autoRuleIds: entry.autoRuleIds,
    });
    setHistoryOpen(false);
  }, []);

  const L = UI[state.lang];

  const autoDetected = new Set(state.autoRuleIds);
  const manualToggles = new Set(
    (Object.entries(state.toggles) as [OWASPRuleId, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k)
  );
  const activeRules = new Set(effectiveRuleIds(state.autoRuleIds, state.toggles));

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      {/* Fixed top-right controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <button
          role="switch"
          aria-checked={state.lang === "en"}
          aria-label={L.ariaLang}
          onClick={() =>
            dispatch({ type: "SET_LANG", lang: state.lang === "fr" ? "en" : "fr" })
          }
          className="relative flex items-center w-18 h-8 rounded-full border border-muted bg-surface cursor-pointer select-none shrink-0 focus-visible:ring-1 focus-visible:ring-accent"
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-accent transition-all duration-200 ease-in-out ${
              state.lang === "en" ? "left-[calc(50%+1px)]" : "left-0.5"
            }`}
          />
          <span
            className={`relative z-10 w-1/2 text-center text-[11px] font-mono uppercase font-semibold transition-colors duration-200 ${
              state.lang === "fr" ? "text-bg" : "text-muted"
            }`}
          >
            FR
          </span>
          <span
            className={`relative z-10 w-1/2 text-center text-[11px] font-mono uppercase font-semibold transition-colors duration-200 ${
              state.lang === "en" ? "text-bg" : "text-muted"
            }`}
          >
            EN
          </span>
        </button>
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-accent">
              he<span className="text-muted">llm</span>et
            </h1>
            <span className="text-xs font-mono text-muted tracking-widest  italic">—secure the prompt—</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {L.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-muted bg-surface p-4">
          <textarea
            value={state.intention}
            onChange={(e) =>
              dispatch({ type: "SET_INTENTION", payload: e.target.value })
            }
            onKeyDown={handleKeyDown}
            placeholder={L.placeholder}
            rows={3}
            className="w-full rounded-md bg-bg text-text font-mono text-sm p-3 resize-y outline-hidden border border-muted focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted"
            aria-label={L.ariaTextarea}
          />

          {state.error && (
            <p className="text-red-400 text-xs" role="alert">
              {state.error}
            </p>
          )}

        <div className="flex items-center gap-2">

          {/* History */}
          {history.length > 0 && (
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="px-4 py-2.5 rounded-md border border-muted text-muted font-mono text-sm hover:border-text hover:text-text transition-colors"
              aria-expanded={historyOpen}
              aria-controls="history-panel"
            >
              {L.historyBtn(history.length, historyOpen)}
            </button>
          )}

          {/* Clear — always visible, disabled if nothing to clear */}
          <button
            onClick={() => dispatch({ type: "CLEAR" })}
            disabled={!state.intention && !state.output}
            className="px-4 py-2.5 rounded-md border border-red-500/60 bg-red-500/10 text-red-400 font-mono text-sm hover:bg-red-700/10 hover:border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-red-500/60"
            aria-label={L.ariaClear}
          >
            {L.clear}
          </button>

          {/* Run — pushed to the right */}
          <button
            onClick={handleSubmit}
            disabled={state.isLoading}
            className="ml-auto flex items-center gap-2.5 px-5 py-2.5 rounded-md bg-accent text-bg font-mono font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label={L.ariaRun}
          >
            {L.run}
          </button>
        </div>
        </div>

        {/* History panel */}
        {historyOpen && history.length > 0 && (
          <div id="history-panel" className="flex flex-col gap-1 rounded-md border border-muted bg-surface p-2">
            {history.map((entry) => (
              <button
                key={entry.timestamp}
                onClick={() => handleRestoreHistory(entry)}
                className="text-left px-3 py-2 rounded text-xs font-mono text-muted hover:bg-bg hover:text-text transition-colors truncate"
                title={entry.intention}
              >
                <span className="text-accent">
                  {new Date(entry.timestamp).toLocaleTimeString(L.locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>{" "}
                {entry.intention}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-md border border-muted bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">
              <span
                className="text-text cursor-help"
                title={L.owaspTooltip}
              >
                {L.owaspLabel}
              </span>{" "}
              {L.owaspDesc}
            </p>
            {manualToggles.size > 0 && (
              <button
                onClick={() => dispatch({ type: "RESET_TOGGLES" })}
                className="shrink-0 text-xs font-mono text-muted hover:text-text transition-colors"
              >
                {L.resetToggles}
              </button>
            )}
          </div>
          <Toggles
            activeToggles={manualToggles}
            autoDetected={autoDetected}
            onChange={handleToggle}
            lang={state.lang}
          />
        </div>

        <div className="rounded-md border border-muted bg-surface p-4">
          <OutputPanel
            output={state.output}
            isLoading={state.isLoading}
            detection={state.detection}
            activeRules={activeRules}
            intention={state.intention}
            lang={state.lang}
          />
        </div>
      </div>

      <footer className="mt-8 text-xs text-muted font-mono">
        <a
          href="https://owasp.org/www-project-top-ten/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent hover:underline transition-colors"
        >
          OWASP Top 10 ↗
        </a>
      </footer>
    </main>
  );
}
