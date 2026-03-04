"use client";

import { useState, useEffect } from "react";
import type { Detection, OWASPRuleId, PromptOutput } from "@/core/types";
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

interface OutputPanelProps {
  output: PromptOutput | null;
  isLoading: boolean;
  detection: Detection | null;
  activeRules: Set<OWASPRuleId>;
  intention: string;
  lang?: Lang;
}

const TOTAL_RULES = getRules().length;

export function OutputPanel({
  output,
  isLoading,
  detection,
  activeRules,
  intention,
  lang = "fr",
}: OutputPanelProps) {
  const L = UI[lang];
  const [clipboardAvailable, setClipboardAvailable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enhancedOutput, setEnhancedOutput] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState(false);

  useEffect(() => {
    setEnhancedOutput(null);
    setEnhanceError(false);
  }, [output]);

  useEffect(() => {
    setClipboardAvailable(
      typeof navigator !== "undefined" && !!navigator.clipboard?.writeText
    );
  }, []);

  const displayText = enhancedOutput ?? output ?? "";

  const handleCopy = async () => {
    if (!displayText) return;
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnhance = async () => {
    if (!output) return;
    setIsEnhancing(true);
    setEnhanceError(false);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intention,
          rules: Array.from(activeRules),
          basePrompt: output,
        }),
      });
      if (!res.ok) throw new Error("enhance failed");
      const { text } = (await res.json()) as { text: string };
      setEnhancedOutput(text);
    } catch {
      setEnhanceError(true);
      setTimeout(() => setEnhanceError(false), 3000);
    } finally {
      setIsEnhancing(false);
    }
  };

  const language = detection?.language ?? null;
  const domains = detection?.domains ?? [];

  const detectionLine =
    language || domains.length > 0
      ? [language, ...domains].filter(Boolean).join(" · ")
      : L.noDetection;

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="animate-pulse rounded-md bg-surface h-48" />
      ) : displayText ? (
        <>
          <div className="relative">
            <textarea
              readOnly
              value={displayText}
              className="w-full h-64 rounded-md bg-surface text-text font-mono text-sm p-3 resize-y outline-hidden border border-muted focus:border-accent focus:ring-1 focus:ring-accent"
              aria-label={L.ariaTextarea}
            />
            <button
              onClick={handleCopy}
              disabled={!clipboardAvailable}
              title={!clipboardAvailable ? L.clipboardUnavailable : undefined}
              className={`absolute top-4 right-6 px-2 py-1 rounded border text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                copied
                  ? "border-accent bg-accent text-bg font-semibold"
                  : "border-muted bg-surface text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {copied ? L.copied : L.copy}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {(detection !== null || activeRules.size > 0) && (
              <div className="flex items-center gap-3 text-xs text-muted">
                <span
                  className={`shrink-0 px-2 py-0.5 rounded font-mono border ${
                    activeRules.size === 0
                      ? "border-muted text-muted"
                      : activeRules.size >= TOTAL_RULES / 2
                      ? "border-accent text-accent"
                      : "border-yellow-500 text-yellow-500"
                  }`}
                  title={L.owaspCoverage}
                  aria-label={L.owaspAriaLabel(activeRules.size, TOTAL_RULES)}
                >
                  {L.rules(activeRules.size, TOTAL_RULES)}
                </span>
                <span>{detectionLine}</span>
              </div>
            )}
            <button
              onClick={handleEnhance}
              disabled={isEnhancing || !!enhancedOutput}
              title={enhancedOutput ? L.enhancedTitle : L.enhanceTitle}
              className={`px-3 py-1.5 rounded border text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto ${
                enhancedOutput
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-muted text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {isEnhancing ? L.enhancing : enhancedOutput ? L.enhanced : L.enhance}
            </button>
          </div>

          {enhanceError && (
            <p className="text-xs text-red-400" role="alert">
              {L.enhanceError}
            </p>
          )}

          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {copied && L.srCopied}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-48 rounded-md bg-surface text-muted text-sm">
          {L.placeholder}
        </div>
      )}

    </div>
  );
}
