"use client";

import type { AnalysisContext, Framework, ScaResult, TargetSide } from "@/core/types";
import type { Lang } from "@/core/prompt-builder";
import { FRAMEWORK_LABELS } from "@/core/framework-detector";

interface ContextPanelProps {
  readonly context: AnalysisContext;
  readonly onFrameworkChange: (f: Framework | null) => void;
  readonly onTargetSideChange: (t: TargetSide) => void;
  readonly onDependenciesDrop: (packageJsonStr: string) => void;
  readonly scaResult: ScaResult | null;
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
    target: "Cible",
    client: "Client",
    both: "Les deux",
    server: "Serveur",
    dropzone: "Déposer package.json",
    dropzoneHint: "ou cliquer pour choisir",
    loaded: (n: number) => `${n} paquet${n > 1 ? "s" : ""} chargé${n > 1 ? "s" : ""}`,
    findings: (n: number) => `${n} finding${n > 1 ? "s" : ""} SCA`,
    detected: "détecté",
  },
  en: {
    framework: "Framework",
    auto: "Auto-detect",
    target: "Target",
    client: "Client",
    both: "Both",
    server: "Server",
    dropzone: "Drop package.json",
    dropzoneHint: "or click to choose",
    loaded: (n: number) => `${n} package${n > 1 ? "s" : ""} loaded`,
    findings: (n: number) => `${n} SCA finding${n > 1 ? "s" : ""}`,
    detected: "detected",
  },
} as const;

export function ContextPanel({
  context,
  onFrameworkChange,
  onTargetSideChange,
  onDependenciesDrop,
  scaResult,
  lang,
}: ContextPanelProps) {
  const L = UI[lang];

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

  const sides: Array<{ value: TargetSide; label: string }> = [
    { value: "client", label: L.client },
    { value: "both", label: L.both },
    { value: "server", label: L.server },
  ];

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

      {/* Target side toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-mono">{L.target}</span>
        <div className="flex rounded border border-muted overflow-hidden">
          {sides.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTargetSideChange(value)}
              className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                context.targetSide === value
                  ? "bg-accent text-bg"
                  : "text-muted hover:text-text hover:bg-surface"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
        />
        <span className={`px-2.5 py-1 rounded border font-mono text-xs transition-colors ${
          scaResult !== null
            ? "border-accent/60 bg-accent/10 text-accent"
            : "border-dashed border-muted text-muted hover:border-text hover:text-text"
        }`}>
          {scaResult !== null
            ? `${L.loaded(scaResult.checkedCount)}${scaResult.findings.length > 0 ? ` · ${L.findings(scaResult.findings.length)}` : ""}`
            : `+ ${L.dropzone}`}
        </span>
        {scaResult === null && (
          <span className="text-[10px] text-muted font-mono hidden sm:inline">{L.dropzoneHint}</span>
        )}
      </label>
    </div>
  );
}
