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
            "Tu es un expert en sécurité logicielle. Tu reçois un prompt de développement avec des contraintes OWASP. " +
            "Enrichis et reformule ce prompt pour le rendre plus précis et actionnable, en conservant strictement toutes les contraintes de sécurité. " +
            "Réponds uniquement avec le prompt enrichi, sans explication ni commentaire.",
        },
        {
          role: "user",
          content:
            `Intention originale : ${intention}\n\n` +
            `Règles OWASP actives : ${rules.join(", ")}\n\n` +
            `Prompt à enrichir :\n${basePrompt}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "LLM service unavailable" }, { status: 500 });
  }
}
