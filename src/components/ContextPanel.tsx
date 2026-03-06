"use client";

import { useState, useEffect } from "react";
import type { AnalysisContext, Framework, ScaResult } from "@/core/types";
import type { Lang } from "@/core/prompt-builder";
import { FRAMEWORK_LABELS } from "@/core/framework-detector";

interface ContextPanelProps {
  readonly context: AnalysisContext;
  readonly onFrameworkChange: (f: Framework | null) => void;
  readonly onDependenciesDrop: (packageJsonStr: string) => void;
  readonly onClearDependencies: () => void;
  readonly scaResult: ScaResult | null;
  readonly scaLoading: boolean;
  readonly scaError: "offline" | null;
  readonly lang: Lang;
}

const FRAMEWORK_OPTIONS: Array<{ value: Framework | "auto"; label: string }> = [
  { value: "auto", label: "Auto-detect" },
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "express", label: "Express" },
  { value: "nestjs", label: "NestJS" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "laravel", label: "Laravel" },
];

const UI = {
  fr: {
    framework: "Framework",
    auto: "Auto-detect",
    dropzone: "Déposer package.json",
    dropzoneHint: "ou cliquer pour choisir",
    loaded: (n: number) => `${n} paquet${n > 1 ? "s" : ""} chargé${n > 1 ? "s" : ""}`,
    findings: (n: number) => `${n} finding${n > 1 ? "s" : ""} SCA`,
    detected: "détecté",
    checking: "Analyse en cours…",
    checkingOsv: "Interrogation de la base OSV…",
    offline: "mode hors ligne",
    partial: "résultats partiels",
  },
  en: {
    framework: "Framework",
    auto: "Auto-detect",
    dropzone: "Drop package.json",
    dropzoneHint: "or click to choose",
    loaded: (n: number) => `${n} package${n > 1 ? "s" : ""} loaded`,
    findings: (n: number) => `${n} SCA finding${n > 1 ? "s" : ""}`,
    detected: "detected",
    checking: "Checking…",
    checkingOsv: "Querying OSV database…",
    offline: "offline mode",
    partial: "partial results",
  },
} as const;

export function ContextPanel({
  context,
  onFrameworkChange,
  onDependenciesDrop,
  onClearDependencies,
  scaResult,
  scaLoading,
  scaError,
  lang,
}: ContextPanelProps) {
  const L = UI[lang];
  const [showOsvHint, setShowOsvHint] = useState(false);

  useEffect(() => {
    if (!scaLoading) {
      setShowOsvHint(false);
      return;
    }
    const timer = setTimeout(() => setShowOsvHint(true), 3000);
    return () => clearTimeout(timer);
  }, [scaLoading]);

  function handleFrameworkChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    onFrameworkChange(val === "auto" ? null : (val as Framework));
  }

  function handleFileDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    readFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  }

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") onDependenciesDrop(text);
    };
    reader.readAsText(file);
  }

  const frameworkSelectValue =
    context.frameworkSource === "manual" && context.framework
      ? context.framework
      : "auto";

  return (
    <div className="flex flex-wrap items-center gap-3 px-1">
      {/* Framework selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-mono">{L.framework}</span>
        <div className="relative">
          <select
            value={frameworkSelectValue}
            onChange={handleFrameworkChange}
            className="appearance-none pl-2.5 pr-6 py-1.5 rounded border border-muted bg-surface text-text font-mono text-xs focus:border-accent focus:ring-1 focus:ring-accent outline-hidden cursor-pointer"
          >
            {FRAMEWORK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value === "auto"
                  ? context.frameworkSource === "auto" && context.framework
                    ? `${L.auto} (${FRAMEWORK_LABELS[context.framework]})`
                    : L.auto
                  : opt.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-muted text-[10px]">▾</span>
        </div>
        {context.frameworkSource === "auto" && context.framework && (
          <span className="text-[10px] font-mono text-accent border border-accent/40 rounded px-1.5 py-0.5">
            {L.detected}
          </span>
        )}
      </div>

      {/* Drag & drop zone */}
      <label
        className="flex items-center gap-2 cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        <input
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={handleFileInput}
          disabled={scaLoading}
        />
        <span className={`px-2.5 py-1 rounded border font-mono text-xs transition-colors ${
          scaLoading
            ? "border-muted/40 bg-surface text-muted animate-pulse"
            : scaResult !== null
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-dashed border-muted text-muted hover:border-text hover:text-text"
        }`}>
          {scaLoading
            ? L.checking
            : scaResult !== null
              ? `${L.loaded(scaResult.checkedCount)}${scaResult.findings.length > 0 ? ` · ${L.findings(scaResult.findings.length)}` : ""}`
              : `+ ${L.dropzone}`}
        </span>
        {scaLoading && showOsvHint && (
          <span className="text-[10px] text-muted font-mono hidden sm:inline">{L.checkingOsv}</span>
        )}
        {!scaLoading && scaResult === null && (
          <span className="text-[10px] text-muted font-mono hidden sm:inline">{L.dropzoneHint}</span>
        )}
        {!scaLoading && scaError === "offline" && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-400">
            {L.offline}
          </span>
        )}
        {!scaLoading && scaError === null && scaResult?.partial && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-400">
            {L.partial}
          </span>
        )}
        {!scaLoading && scaResult !== null && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClearDependencies(); }}
            className="px-2 py-0.5 rounded border border-muted text-muted font-mono text-xs hover:border-red-400 hover:text-red-400 transition-colors"
            aria-label="Clear dependencies"
          >
            ✕
          </button>
        )}
      </label>
    </div>
  );
}
