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

  const { code, rules, lang } = body as {
    code?: string;
    rules?: string[];
    lang?: "fr" | "en";
  };

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }
  if (!Array.isArray(rules)) {
    return NextResponse.json({ error: "rules must be an array" }, { status: 400 });
  }

  const isEn = lang === "en";

  const systemPrompt = isEn
    ? "You are a security expert. You receive vulnerable code and a list of OWASP rules. " +
      "Your task is to identify the vulnerable lines and return ONLY the corrected version of those lines. " +
      "Do NOT return the entire file. Do NOT add comments. Do NOT add explanations. " +
      "Output only the fixed code snippet, nothing else."
    : "Tu es un expert en sécurité. Tu reçois du code vulnérable et une liste de règles OWASP. " +
      "Ta tâche est d'identifier les lignes vulnérables et de retourner UNIQUEMENT la version corrigée de ces lignes. " +
      "Ne retourne PAS le fichier entier. N'ajoute PAS de commentaires. N'ajoute PAS d'explications. " +
      "Retourne uniquement le snippet de code corrigé, rien d'autre.";

  const userPrompt = isEn
    ? `OWASP rules to fix: ${rules.join(", ")}\n\nVulnerable code:\n${code}\n\nReturn only the corrected lines.`
    : `Règles OWASP à corriger : ${rules.join(", ")}\n\nCode vulnérable :\n${code}\n\nRetourne uniquement les lignes corrigées.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ code: text });
  } catch {
    return NextResponse.json({ error: "LLM service unavailable" }, { status: 500 });
  }
}
