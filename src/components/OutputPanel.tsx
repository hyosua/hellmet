"use client";

import { useState, useEffect } from "react";
import type { Detection, OWASPRuleId, PromptOutput } from "@/core/types";

interface OutputPanelProps {
  output: PromptOutput | null;
  isLoading: boolean;
  detection: Detection | null;
  activeRules: Set<OWASPRuleId>;
  intention: string;
}

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

  // Reset enhancement when a new output is generated
  useEffect(() => {
    setEnhancedOutput(null);
    setEnhanceError(false);
  }, [output]);

  useEffect(() => {
    setClipboardAvailable(
      typeof navigator !== "undefined" && !!navigator.clipboard?.writeText
    );
  }, []);

  const displayOutput = enhancedOutput ?? output;

  const handleCopy = async (target: "claude" | "gpt") => {
    if (!displayOutput) return;
    await navigator.clipboard.writeText(
      target === "claude" ? displayOutput.claude : displayOutput.gpt
    );
    setCopiedTarget(target);
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
  const domain = detection?.domain ?? null;

  const detectionLine =
    language || domain
      ? [language, domain].filter(Boolean).join(" · ")
      : "Aucune détection";

  const rulesLine =
    activeRules.size > 0 ? Array.from(activeRules).join(", ") : "Aucune";

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="animate-pulse rounded-md bg-[--color-surface] h-48" />
      ) : displayOutput ? (
        <>
          <textarea
            readOnly
            value={displayOutput.claude}
            className="w-full h-64 rounded-md bg-[--color-surface] text-[--color-text] font-mono text-sm p-3 resize-y outline-hidden border border-[--color-muted] focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]"
            aria-label="Prompt sécurisé généré"
          />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleCopy("claude")}
              disabled={!clipboardAvailable}
              title={!clipboardAvailable ? "Clipboard non disponible dans ce contexte" : undefined}
              className="px-3 py-1.5 rounded border border-[--color-muted] text-xs font-mono text-[--color-text] hover:border-[--color-accent] hover:text-[--color-accent] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {copiedTarget === "claude" ? "Copié !" : "Copy for Claude"}
            </button>
            <button
              onClick={() => handleCopy("gpt")}
              disabled={!clipboardAvailable}
              title={!clipboardAvailable ? "Clipboard non disponible dans ce contexte" : undefined}
              className="px-3 py-1.5 rounded border border-[--color-muted] text-xs font-mono text-[--color-text] hover:border-[--color-accent] hover:text-[--color-accent] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {copiedTarget === "gpt" ? "Copié !" : "Copy for GPT"}
            </button>
            <button
              onClick={handleEnhance}
              disabled={isEnhancing}
              className="px-3 py-1.5 rounded border border-[--color-muted] text-xs font-mono text-[--color-muted] hover:border-[--color-accent] hover:text-[--color-accent] disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
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
            {copiedTarget === "claude" && "Prompt Claude copié dans le presse-papiers"}
            {copiedTarget === "gpt" && "Prompt GPT copié dans le presse-papiers"}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-48 rounded-md bg-[--color-surface] text-[--color-muted] text-sm">
          Le prompt sécurisé apparaîtra ici
        </div>
      )}

      {(detection !== null || activeRules.size > 0) && (
        <div className="text-xs text-[--color-muted] space-y-0.5">
          <p>
            <span className="text-[--color-accent]">Détection</span> :{" "}
            {detectionLine}
          </p>
          <p>
            <span className="text-[--color-accent]">Règles injectées</span> :{" "}
            {rulesLine}
          </p>
        </div>
      )}
    </div>
  );
}
