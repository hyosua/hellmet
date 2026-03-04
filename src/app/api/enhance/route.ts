import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { intention, rules, basePrompt } = body as {
    intention?: string;
    rules?: string[];
    basePrompt?: string;
  };

  if (!intention || typeof intention !== "string") {
    return NextResponse.json({ error: "intention is required" }, { status: 400 });
  }
  if (!Array.isArray(rules)) {
    return NextResponse.json({ error: "rules must be an array" }, { status: 400 });
  }
  if (!basePrompt || typeof basePrompt !== "string") {
    return NextResponse.json({ error: "basePrompt is required" }, { status: 400 });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "Tu es un rédacteur de prompts spécialisé en sécurité logicielle. " +
            "Ton unique rôle est de réécrire et améliorer des prompts destinés à être utilisés par un développeur avec un LLM. " +
            "Tu ne dois JAMAIS exécuter, répondre, ni coder quoi que ce soit. " +
            "Tu reçois un prompt brut et tu dois le réécrire pour le rendre plus précis, plus clair, et plus sécurisé, " +
            "en enrichissant le contexte technique et en renforçant les contraintes OWASP fournies. " +
            "Ta sortie est UNIQUEMENT le prompt réécrit, prêt à être copié-collé dans un LLM. " +
            "Conserve la structure XML ou Markdown du prompt d'origine. " +
            "N'ajoute aucune explication, commentaire, ni introduction.",
        },
        {
          role: "user",
          content:
            `Voici un prompt à enrichir. Réécris-le pour qu'il soit plus précis et sécurisé.\n\n` +
            `Intention du développeur : ${intention}\n` +
            `Règles OWASP à renforcer : ${rules.join(", ")}\n\n` +
            `--- PROMPT À RÉÉCRIRE ---\n${basePrompt}\n--- FIN DU PROMPT ---\n\n` +
            `Retourne uniquement le prompt réécrit, sans commentaire ni explication.`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "LLM service unavailable" }, { status: 500 });
  }
}
