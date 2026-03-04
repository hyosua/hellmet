"use client";

import { useState, useEffect } from "react";
import type { Detection, OWASPRuleId, PromptOutput } from "@/core/types";
import { getRules } from "@/core/constraints";

interface OutputPanelProps {
  output: PromptOutput | null;
  isLoading: boolean;
  detection: Detection | null;
  activeRules: Set<OWASPRuleId>;
  intention: string;
}

const TOTAL_RULES = getRules().length;

export function OutputPanel({
  output,
  isLoading,
  detection,
  activeRules,
  intention,
}: OutputPanelProps) {
  const [clipboardAvailable, setClipboardAvailable] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<"claude" | "gpt" | null>(null);
  const [enhancedOutput, setEnhancedOutput] = useState<PromptOutput | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState(false);
  const [activeFormat, setActiveFormat] = useState<"claude" | "gpt">("claude");

  useEffect(() => {
    setEnhancedOutput(null);
    setEnhanceError(false);
    setActiveFormat("claude");
  }, [output]);

  useEffect(() => {
    setClipboardAvailable(
      typeof navigator !== "undefined" && !!navigator.clipboard?.writeText
    );
  }, []);

  const displayOutput = enhancedOutput ?? output;
  const displayText = displayOutput
    ? activeFormat === "claude"
      ? displayOutput.claude
      : displayOutput.gpt
    : "";

  const handleCopy = async () => {
    if (!displayOutput) return;
    await navigator.clipboard.writeText(displayText);
    setCopiedTarget(activeFormat);
    setTimeout(() => setCopiedTarget(null), 2000);
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
          basePrompt: output.claude,
        }),
      });
      if (!res.ok) throw new Error("enhance failed");
      const { text } = (await res.json()) as { text: string };
      setEnhancedOutput({ claude: text, gpt: text });
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
      : "Aucune détection";

  const rulesLine =
    activeRules.size > 0 ? Array.from(activeRules).join(", ") : "Aucune";

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="animate-pulse rounded-md bg-surface h-48" />
      ) : displayOutput ? (
        <>
          {/* Format switcher tabs */}
          <div className="flex gap-1" role="tablist" aria-label="Format du prompt">
            <button
              role="tab"
              id="tab-claude"
              aria-selected={activeFormat === "claude"}
              aria-controls="panel-prompt"
              onClick={() => setActiveFormat("claude")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                activeFormat === "claude"
                  ? "bg-accent text-bg font-semibold"
                  : "text-muted hover:text-text"
              }`}
            >
              Claude XML
            </button>
            <button
              role="tab"
              id="tab-gpt"
              aria-selected={activeFormat === "gpt"}
              aria-controls="panel-prompt"
              onClick={() => setActiveFormat("gpt")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                activeFormat === "gpt"
                  ? "bg-accent text-bg font-semibold"
                  : "text-muted hover:text-text"
              }`}
            >
              GPT Markdown
            </button>
          </div>

          <textarea
            id="panel-prompt"
            role="tabpanel"
            aria-labelledby={activeFormat === "claude" ? "tab-claude" : "tab-gpt"}
            readOnly
            value={displayText}
            className="w-full h-64 rounded-md bg-surface text-text font-mono text-sm p-3 resize-y outline-hidden border border-muted focus:border-accent focus:ring-1 focus:ring-accent"
            aria-label={`Prompt sécurisé — format ${activeFormat === "claude" ? "Claude XML" : "GPT Markdown"}`}
          />

          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={handleCopy}
              disabled={!clipboardAvailable}
              title={!clipboardAvailable ? "Clipboard non disponible dans ce contexte" : undefined}
              className={`px-3 py-1.5 rounded border text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                copiedTarget
                  ? "border-accent bg-accent text-bg font-semibold"
                  : "border-muted text-text hover:border-accent hover:text-accent"
              }`}
            >
              {copiedTarget ? "Copié !" : `Copy for ${activeFormat === "claude" ? "Claude" : "GPT"}`}
            </button>
            <button
              onClick={handleEnhance}
              disabled={isEnhancing}
              title={enhancedOutput ? "Prompt enrichi par l'IA" : "Enrichit le prompt généré pour le rendre plus précis et robuste"}
              className={`px-3 py-1.5 rounded border text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto ${
                enhancedOutput
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-muted text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {isEnhancing ? "Enrichissement…" : enhancedOutput ? "✓ Enrichi" : "Enhance with AI"}
            </button>
          </div>

          {enhanceError && (
            <p className="text-xs text-red-400" role="alert">
              Enrichissement indisponible
            </p>
          )}

          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {copiedTarget && `Prompt ${copiedTarget === "claude" ? "Claude" : "GPT"} copié dans le presse-papiers`}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-48 rounded-md bg-surface text-muted text-sm">
          Le prompt sécurisé apparaîtra ici
        </div>
      )}

      {(detection !== null || activeRules.size > 0) && !isLoading && (
        <div className="flex items-start justify-between gap-4">
          <div className="text-xs text-muted space-y-0.5">
            <p>
              <span className="text-accent">Détection</span> :{" "}
              {detectionLine}
            </p>
            <p>
              <span className="text-accent">Règles injectées</span> :{" "}
              {rulesLine}
            </p>
          </div>
          {/* T043 — coverage score badge */}
          <span
            className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono border ${
              activeRules.size === 0
                ? "border-muted text-muted"
                : activeRules.size >= TOTAL_RULES / 2
                ? "border-accent text-accent"
                : "border-yellow-500 text-yellow-500"
            }`}
            title="Couverture OWASP"
            aria-label={`Couverture OWASP : ${activeRules.size} sur ${TOTAL_RULES} règles actives`}
          >
            {activeRules.size}/{TOTAL_RULES} règles
          </span>
        </div>
      )}
    </div>
  );
}
