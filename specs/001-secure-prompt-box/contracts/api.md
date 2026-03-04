# API Contracts: Hellmet — Secure Prompt Box

**Date**: 2026-03-04

> The core prompt generation runs entirely client-side (no API call). The single API route below is optional — used only when the "LLM enhance" feature is enabled (v1 optional path).

---

## `POST /api/enhance`

Sends a locally-generated secured prompt to Groq for LLM-based reformulation/enrichment.

### Request

```http
POST /api/enhance
Content-Type: application/json
```

```json
{
  "intention": "Crée une route d'api pour uploader des images en Node",
  "rules": ["A01", "A04"],
  "basePrompt": "Crée une route d'api sécurisée en Node.js pour l'upload..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `intention` | `string` | Yes | Raw user intention text |
| `rules` | `string[]` | Yes | Active OWASP rule IDs (e.g., `["A01", "A04"]`) |
| `basePrompt` | `string` | Yes | Locally-generated prompt to enrich |

### Response — Success (200)

```json
{
  "text": "Crée une route d'api sécurisée en Node.js pour l'upload d'images..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `text` | `string` | LLM-enriched prompt text (plain text, not formatted) |

### Response — Error (400)

```json
{
  "error": "intention is required"
}
```

### Response — Error (500)

```json
{
  "error": "LLM service unavailable"
}
```

### Notes

- This endpoint is **server-only** — the `GROQ_API_KEY` is never exposed to the client.
- Response time target: < 500ms time-to-first-byte.
- The UI falls back gracefully to the local prompt if this endpoint is unavailable or returns an error.
- No authentication in v1 — rate-limiting is handled by Vercel's built-in limits.
