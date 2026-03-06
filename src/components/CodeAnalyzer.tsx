"use client";

import { useReducer, useCallback } from "react";
import type { AnalysisContext, CodeAnalysisResult, OWASPRuleId, ParsedDependency, PromptOutput, ScaResult, Framework } from "@/core/types";
import type { Lang } from "@/core/prompt-builder";
import { analyzeCode } from "@/core/code-analyzer";
import { detectFramework } from "@/core/framework-detector";
import { parseDependencies, analyzeScaDependencies } from "@/core/sca-analyzer";
import { getRulesByIds } from "@/core/constraints";
import { buildFixPrompt } from "@/core/prompt-builder";
import { ContextPanel } from "./ContextPanel";
import { VulnerabilityReport } from "./VulnerabilityReport";
import { Toggles } from "./Toggles";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

// ---------------------------------------------------------------------------
// State & Reducer
// ---------------------------------------------------------------------------

const INITIAL_TOGGLES: Record<OWASPRuleId, boolean> = {
  A01: false, A02: false, A03: false, A04: false, A05: false,
  A06: false, A07: false, A08: false, A09: false, A10: false,
};

const INITIAL_CONTEXT: AnalysisContext = {
  framework: null,
  frameworkSource: null,
  targetSide: "both",
  scaDependencies: null,
};

type State = {
  codeInput: string;
  lang: Lang;
  context: AnalysisContext;
  scaResult: ScaResult | null;
  analysis: CodeAnalysisResult | null;
  toggles: Record<OWASPRuleId, boolean>;
  autoRuleIds: OWASPRuleId[];
  fixPromptOutput: PromptOutput | null;
  error: string | null;
};

const initialState: State = {
  codeInput: "",
  lang: "fr",
  context: INITIAL_CONTEXT,
  scaResult: null,
  analysis: null,
  toggles: INITIAL_TOGGLES,
  autoRuleIds: [],
  fixPromptOutput: null,
  error: null,
};

type Action =
  | { type: "SET_CODE"; payload: string }
  | { type: "SET_LANG"; lang: Lang }
  | { type: "SET_FRAMEWORK"; framework: Framework | null }
  | { type: "SET_SCA"; scaResult: ScaResult; deps: ParsedDependency[] }
  | { type: "SET_ANALYSIS"; analysis: CodeAnalysisResult; context: AnalysisContext }
  | { type: "TOGGLE_RULE"; id: OWASPRuleId; active: boolean }
  | { type: "GENERATE_FIX"; output: PromptOutput }
  | { type: "SET_ERROR"; message: string }
  | { type: "CLEAR" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CODE":
      return { ...state, codeInput: action.payload, error: null };
    case "SET_LANG":
      return { ...state, lang: action.lang };
    case "SET_FRAMEWORK":
      return {
        ...state,
        context: {
          ...state.context,
          framework: action.framework,
          frameworkSource: "manual",
        },
      };
    case "SET_SCA":
      return {
        ...state,
        scaResult: action.scaResult,
        context: { ...state.context, scaDependencies: action.deps },
      };
    case "SET_ANALYSIS":
      return {
        ...state,
        analysis: action.analysis,
        context: action.context,
        autoRuleIds: action.analysis.detectedRuleIds,
        fixPromptOutput: null,
        error: null,
      };
    case "TOGGLE_RULE":
      return { ...state, toggles: { ...state.toggles, [action.id]: action.active } };
    case "GENERATE_FIX":
      return { ...state, fixPromptOutput: action.output };
    case "SET_ERROR":
      return { ...state, error: action.message };
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
}

function effectiveRuleIds(
  autoRuleIds: OWASPRuleId[],
  toggles: Record<OWASPRuleId, boolean>
): OWASPRuleId[] {
  const manualIds = (Object.entries(toggles) as [OWASPRuleId, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k);
  return [...new Set([...autoRuleIds, ...manualIds])];
}

// ---------------------------------------------------------------------------
// UI labels
// ---------------------------------------------------------------------------

const UI = {
  fr: {
    subtitle: "Détectez les vulnérabilités OWASP dans votre code.",
    placeholder: "Collez un snippet de code ici...",
    ariaTextarea: "Code à analyser",
    errorEmpty: "Le code ne peut pas être vide.",
    analyze: "→ Analyser",
    clear: "✕ Clear",
    ariaLang: "Langue de sortie",
    owaspLabel: "Règles OWASP",
    owaspDesc: "— détectées automatiquement, activables manuellement.",
    navPrompt: "→ Prompt builder",
  },
  en: {
    subtitle: "Detect OWASP vulnerabilities in your code.",
    placeholder: "Paste a code snippet here...",
    ariaTextarea: "Code to analyze",
    errorEmpty: "Code cannot be empty.",
    analyze: "→ Analyze",
    clear: "✕ Clear",
    ariaLang: "Output language",
    owaspLabel: "OWASP Rules",
    owaspDesc: "— auto-detected, can be toggled manually.",
    navPrompt: "→ Prompt builder",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CodeAnalyzer() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const L = UI[state.lang];

  const handleAnalyze = useCallback(() => {
    if (!state.codeInput.trim()) {
      dispatch({ type: "SET_ERROR", message: L.errorEmpty });
      return;
    }
    const resolvedContext: AnalysisContext =
      state.context.frameworkSource !== "manual"
        ? { ...state.context, framework: detectFramework(state.codeInput), frameworkSource: "auto" }
        : state.context;
    const analysis = analyzeCode(state.codeInput, resolvedContext);
    dispatch({ type: "SET_ANALYSIS", analysis, context: resolvedContext });
  }, [state.codeInput, state.context, L.errorEmpty]);

  const handleGenerateFixPrompt = useCallback(() => {
    const allIds = effectiveRuleIds(state.autoRuleIds, state.toggles);
    const rules = getRulesByIds(allIds);
    const output = buildFixPrompt(state.codeInput, rules, state.lang, state.context);
    dispatch({ type: "GENERATE_FIX", output });
  }, [state.codeInput, state.autoRuleIds, state.toggles, state.lang, state.context]);

  const handleToggle = useCallback((id: OWASPRuleId, active: boolean) => {
    dispatch({ type: "TOGGLE_RULE", id, active });
  }, []);

  const handleFrameworkChange = useCallback((framework: Framework | null) => {
    dispatch({ type: "SET_FRAMEWORK", framework });
  }, []);

  const handleDependenciesDrop = useCallback((packageJsonStr: string) => {
    const deps = parseDependencies(packageJsonStr);
    const scaResult = analyzeScaDependencies(deps);
    dispatch({ type: "SET_SCA", scaResult, deps });
  }, []);

  const autoDetected = new Set(state.autoRuleIds);
  const manualToggles = new Set(
    (Object.entries(state.toggles) as [OWASPRuleId, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k)
  );

  return (
    <main className="min-h-screen flex flex-col px-6 py-8 gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-accent">
              he<span className="text-muted">llm</span>et
            </h1>
            <span className="text-xs font-mono text-muted tracking-widest italic">—detect vulnerabilities—</span>
          </div>
          <p className="mt-1 text-sm text-muted">{L.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/prompt"
            className="text-xs font-mono text-muted hover:text-accent transition-colors"
          >
            {L.navPrompt}
          </Link>
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
            <span className={`relative z-10 w-1/2 text-center text-[11px] font-mono uppercase font-semibold transition-colors duration-200 ${state.lang === "fr" ? "text-bg" : "text-muted"}`}>
              FR
            </span>
            <span className={`relative z-10 w-1/2 text-center text-[11px] font-mono uppercase font-semibold transition-colors duration-200 ${state.lang === "en" ? "text-bg" : "text-muted"}`}>
              EN
            </span>
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Context panel */}
      <ContextPanel
        context={state.context}
        onFrameworkChange={handleFrameworkChange}
        onDependenciesDrop={handleDependenciesDrop}
        scaResult={state.scaResult}
        lang={state.lang}
      />

      {/* Main 2-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left column — code input */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <textarea
            value={state.codeInput}
            onChange={(e) => dispatch({ type: "SET_CODE", payload: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnalyze(); } }}
            placeholder={L.placeholder}
            rows={20}
            className="w-full flex-1 rounded-md bg-surface text-text font-mono text-sm p-3 resize-none outline-hidden border border-muted focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted"
            aria-label={L.ariaTextarea}
          />
          {state.error && (
            <p className="text-red-400 text-xs font-mono" role="alert">{state.error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: "CLEAR" })}
              disabled={!state.codeInput && !state.analysis}
              className="px-4 py-2.5 rounded-md border border-red-500/60 bg-red-500/10 text-red-400 font-mono text-sm hover:bg-red-700/10 hover:border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {L.clear}
            </button>
            <button
              onClick={handleAnalyze}
              className="ml-auto px-5 py-2.5 rounded-md bg-accent text-bg font-mono font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {L.analyze}
            </button>
          </div>
        </div>

        {/* Right column — results */}
        <div className="flex-1 min-w-0 rounded-md border border-muted bg-surface p-4 overflow-y-auto">
          <VulnerabilityReport
            result={state.analysis}
            scaResult={state.scaResult}
            fixPromptOutput={state.fixPromptOutput}
            onGenerateFixPrompt={handleGenerateFixPrompt}
            lang={state.lang}
          />
        </div>
      </div>

      {/* OWASP Toggles */}
      <div className="rounded-md border border-muted bg-surface p-4 flex flex-col gap-3">
        <p className="text-xs text-muted">
          <span className="text-text">{L.owaspLabel}</span>{" "}{L.owaspDesc}
        </p>
        <Toggles
          activeToggles={manualToggles}
          autoDetected={autoDetected}
          onChange={handleToggle}
          lang={state.lang}
        />
      </div>

      <footer className="text-xs text-muted font-mono">
        <a
          href="https://owasp.org/Top10/2025"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent hover:underline transition-colors"
        >
          OWASP Top 10 - 2025 ↗
        </a>
      </footer>
    </main>
  );
}
