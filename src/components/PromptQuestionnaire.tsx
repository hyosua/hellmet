"use client";

import type { AppType, QuestionnaireAnswers } from "@/core/questionnaire-mapper";

type Lang = "fr" | "en";

const APP_TYPES: { value: AppType; label: Record<Lang, string> }[] = [
  { value: "web",    label: { fr: "Web App",  en: "Web App"  } },
  { value: "api",    label: { fr: "API REST", en: "REST API" } },
  { value: "cli",    label: { fr: "CLI",      en: "CLI"      } },
  { value: "mobile", label: { fr: "Mobile",   en: "Mobile"   } },
  { value: "other",  label: { fr: "Autre",    en: "Other"    } },
];

const QUESTIONS: {
  key: Exclude<keyof QuestionnaireAnswers, "description" | "appType">;
  label: Record<Lang, string>;
}[] = [
  { key: "hasAuth",          label: { fr: "Authentification (login, sessions, tokens)", en: "Authentication (login, sessions, tokens)" } },
  { key: "hasDatabase",      label: { fr: "Base de données (SQL, NoSQL, ORM…)",         en: "Database (SQL, NoSQL, ORM…)"              } },
  { key: "hasFileUpload",    label: { fr: "Upload de fichiers",                          en: "File uploads"                             } },
  { key: "hasSensitiveData", label: { fr: "Données utilisateurs sensibles (PII, CB…)",  en: "Sensitive user data (PII, card…)"         } },
  { key: "hasMultiUserRoles",label: { fr: "Gestion de rôles / accès multi-utilisateurs",en: "Role-based / multi-user access control"   } },
];

const UI = {
  fr: {
    descriptionLabel: "Décris ce que tu veux construire",
    descriptionPlaceholder: "Ex : route API pour créer un compte utilisateur avec JWT",
    appTypeLabel: "Type d'application",
    featuresLabel: "Cette app gère…",
  },
  en: {
    descriptionLabel: "Describe what you want to build",
    descriptionPlaceholder: "Ex: API route to create a user account with JWT",
    appTypeLabel: "Application type",
    featuresLabel: "This app handles…",
  },
} as const;

interface Props {
  readonly answers: QuestionnaireAnswers;
  readonly onChange: (answers: QuestionnaireAnswers) => void;
  readonly lang: Lang;
}

export function PromptQuestionnaire({ answers, onChange, lang }: Props) {
  const L = UI[lang];

  function set<K extends keyof QuestionnaireAnswers>(key: K, value: QuestionnaireAnswers[K]) {
    onChange({ ...answers, [key]: value });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-mono text-muted">{L.descriptionLabel}</label>
        <textarea
          value={answers.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder={L.descriptionPlaceholder}
          rows={3}
          className="w-full rounded-md bg-bg text-text font-mono text-sm p-3 resize-y outline-hidden border border-muted focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted"
        />
      </div>

      {/* App type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-mono text-muted">{L.appTypeLabel}</label>
        <div className="flex flex-wrap gap-2">
          {APP_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("appType", value)}
              className={`px-3 py-1.5 rounded-md border font-mono text-xs transition-colors ${
                answers.appType === value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-muted text-muted hover:border-text hover:text-text"
              }`}
            >
              {label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Boolean questions */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono text-muted">{L.featuresLabel}</label>
        {QUESTIONS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={answers[key]}
              onChange={(e) => set(key, e.target.checked)}
              className="w-4 h-4 rounded border-muted accent-accent cursor-pointer"
            />
            <span className="text-sm font-mono text-muted group-hover:text-text transition-colors">
              {label[lang]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
