"use client";

import { useState, useEffect } from "react";
import type { OWASPRuleId, PromptOutput } from "@/core/types";
import { getRules } from "@/core/constraints";

type Lang = "fr" | "en";

const UI = {
  fr: {
    copy: "Copy",
    copied: "Copié !",
    clipboardUnavailable: "Clipboard non disponible dans ce contexte",
    owaspCoverage: "Couverture OWASP",
    owaspAriaLabel: (a: number, t: number) => `Couverture OWASP : ${a} sur ${t} règles actives`,
    rules: (a: number, t: number) => `${a}/${t} règles`,
    noDetection: "Aucune détection",
    enhancing: "Enrichissement…",
    enhanced: "✓ Enrichi",
    enhance: "Enhance with AI",
    enhancedTitle: "Prompt enrichi par l'IA",
    enhanceTitle: "Enrichit le prompt généré pour le rendre plus précis et robuste",
    enhanceError: "Enrichissement indisponible",
    srCopied: "Prompt copié dans le presse-papiers",
    placeholder: "Le prompt sécurisé apparaîtra ici",
    ariaTextarea: "Prompt sécurisé",
  },
  en: {
    copy: "Copy",
    copied: "Copied!",
    clipboardUnavailable: "Clipboard not available in this context",
    owaspCoverage: "OWASP Coverage",
    owaspAriaLabel: (a: number, t: number) => `OWASP coverage: ${a} of ${t} rules active`,
    rules: (a: number, t: number) => `${a}/${t} rules`,
    noDetection: "No detection",
    enhancing: "Enhancing…",
    enhanced: "✓ Enhanced",
    enhance: "Enhance with AI",
    enhancedTitle: "AI-enhanced prompt",
    enhanceTitle: "Enriches the generated prompt for more precision and security",
    enhanceError: "Enhancement unavailable",
    srCopied: "Prompt copied to clipboard",
    placeholder: "The secure prompt will appear here",
    ariaTextarea: "Secure prompt",
  },
} as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useClipboard() {
  const [available, setAvailable] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAvailable(typeof navigator !== "undefined" && !!navigator.clipboard?.writeText);
  }, []);

  const copy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { available, copied, copy };
}

function useEnhance(output: PromptOutput | null, intention: string, activeRules: Set<OWASPRuleId>) {
  const [enhancedOutput, setEnhancedOutput] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setEnhancedOutput(null);
    setHasError(false);
  }, [output]);

  const enhance = async () => {
    if (!output) return;
    setIsEnhancing(true);
    setHasError(false);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intention, rules: Array.from(activeRules), basePrompt: output }),
      });
      if (!res.ok) throw new Error("enhance failed");
      const { text } = (await res.json()) as { text: string };
      setEnhancedOutput(text);
    } catch {
      setHasError(true);
      setTimeout(() => setHasError(false), 3000);
    } finally {
      setIsEnhancing(false);
    }
  };

  return { enhancedOutput, isEnhancing, hasError, enhance };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const TOTAL_RULES = getRules().length;

interface DetectionInfoProps {
  readonly activeRules: Set<OWASPRuleId>;
  readonly labels: (typeof UI)[Lang];
}

function badgeClass(size: number): string {
  if (size === 0) return "border-muted text-muted";
  if (size >= TOTAL_RULES / 2) return "border-accent text-accent";
  return "border-yellow-500 text-yellow-500";
}

function DetectionInfo({ activeRules, labels }: DetectionInfoProps) {
  if (activeRules.size === 0) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span
        className={`shrink-0 px-2 py-0.5 rounded font-mono border ${badgeClass(activeRules.size)}`}
        title={labels.owaspCoverage}
        aria-label={labels.owaspAriaLabel(activeRules.size, TOTAL_RULES)}
      >
        {labels.rules(activeRules.size, TOTAL_RULES)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OutputPanelProps {
  readonly output: PromptOutput | null;
  readonly isLoading: boolean;
  readonly activeRules: Set<OWASPRuleId>;
  readonly intention: string;
  readonly lang?: Lang;
}

export function OutputPanel({
  output,
  isLoading,
  activeRules,
  intention,
  lang = "fr",
}: OutputPanelProps) {
  const labels = UI[lang];
  const { available: clipboardAvailable, copied, copy } = useClipboard();
  const { enhancedOutput, isEnhancing, hasError, enhance } = useEnhance(output, intention, activeRules);

  const displayText = enhancedOutput ?? output ?? "";

  let enhanceLabel: string;
  if (isEnhancing) {
    enhanceLabel = labels.enhancing;
  } else if (enhancedOutput) {
    enhanceLabel = labels.enhanced;
  } else {
    enhanceLabel = labels.enhance;
  }
  const copyButtonClass = copied
    ? "border-accent bg-accent text-bg font-semibold"
    : "border-muted bg-surface text-muted hover:border-accent hover:text-accent";
  const enhanceButtonClass = enhancedOutput
    ? "border-accent bg-accent/15 text-accent"
    : "border-muted text-muted hover:border-accent hover:text-accent";

  if (isLoading) {
    return <div className="animate-pulse rounded-md bg-surface h-48" />;
  }

  if (!displayText) {
    return (
      <div className="flex items-center justify-center h-48 rounded-md bg-surface text-muted text-sm">
        {labels.placeholder}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <textarea
          readOnly
          value={displayText}
          className="w-full h-64 rounded-md bg-surface text-text font-mono text-sm p-3 resize-y outline-hidden border border-muted focus:border-accent focus:ring-1 focus:ring-accent"
          aria-label={labels.ariaTextarea}
        />
        <button
          onClick={() => copy(displayText)}
          disabled={!clipboardAvailable}
          title={clipboardAvailable ? undefined : labels.clipboardUnavailable}
          className={`absolute top-4 right-6 px-2 py-1 rounded border text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${copyButtonClass}`}
        >
          {copied ? labels.copied : labels.copy}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <DetectionInfo activeRules={activeRules} labels={labels} />
        <button
          onClick={enhance}
          disabled={isEnhancing || !!enhancedOutput}
          title={enhancedOutput ? labels.enhancedTitle : labels.enhanceTitle}
          className={`px-3 py-1.5 rounded border text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto ${enhanceButtonClass}`}
        >
          {enhanceLabel}
        </button>
      </div>

      {hasError && (
        <p className="text-xs text-red-400" role="alert">
          {labels.enhanceError}
        </p>
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {copied && labels.srCopied}
      </div>
    </div>
  );
}
