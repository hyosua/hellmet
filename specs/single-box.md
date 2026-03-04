# Spec — Hellmet "Single Box"

> Interface unique de transformation : intention brute → prompt sécurisé prêt à coller dans un LLM.

---

## Objectif

L'utilisateur décrit ce qu'il veut coder en langage naturel. Hellmet analyse cette intention, détecte le contexte technique, injecte les contraintes de sécurité pertinentes (OWASP), et génère un prompt durci prêt à coller dans ChatGPT, Claude ou Cursor.

---

## User Flow

```
[Intention brute]
    ↓
[Détection : langage + domaine]
    ↓
[Mapping OWASP]
    ↓
[Injection de contraintes]
    ↓
[Prompt blindé]
```

**Exemple concret :**

- Input : `"Crée une route d'api pour uploader des images en Node"`
- Détection : `Node.js` + `File Upload`
- OWASP mappé : `A01` (Access Control), `A04` (Insecure Design)
- Output :
  > "Crée une route d'api sécurisée en Node.js pour l'upload d'images. Contraintes impératives : Valider le type MIME (pas seulement l'extension), limiter la taille à 5Mo, renommer les fichiers avec un UUID pour éviter le Path Traversal, et vérifier l'authentification JWT avant l'upload."

---

## Interface

```
┌─────────────────────────────────────────────────────────┐
│  Hellmet                                    [⚙ Settings] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Décris ce que tu veux coder...                   │  │
│  │                                                   │  │
│  │                                           [→ Run] │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Security Toggles                                       │
│  [A01 Access Control] [A02 Crypto] [A03 Injection]      │
│  [A04 Insecure Design] [A07 Auth] [A09 Logging]         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Prompt généré                    [Copy for Claude] [Copy for GPT] │
│  ┌───────────────────────────────────────────────────┐  │
│  │  <output sécurisé>                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Détection : Node.js · File Upload                      │
│  Règles injectées : A01, A04                            │
└─────────────────────────────────────────────────────────┘
```

---

## Fonctionnalités

### 1. Détection d'intention

**Langages détectés :** Python, JavaScript, TypeScript, Node.js, SQL, Go, Rust, PHP, Java, C#, Bash.

**Domaines détectés :**
| Domaine | Mots-clés déclencheurs |
|---------|------------------------|
| `api` | route, endpoint, REST, API, controller |
| `auth` | login, JWT, session, token, password, OAuth |
| `upload` | upload, fichier, image, file, multipart |
| `database` | SQL, query, SELECT, INSERT, ORM, prisma |
| `frontend` | composant, form, input, UI, render |
| `crypto` | chiffrer, hash, encrypt, bcrypt, AES |

Détection via matching de mots-clés (v1). NLP local ou appel LLM léger possible en v2.

---

### 2. Mapping OWASP

| Domaine détecté | OWASP injecté automatiquement |
|-----------------|-------------------------------|
| `auth` | A02 (Crypto Failures), A07 (Auth Failures) |
| `upload` | A01 (Access Control), A04 (Insecure Design) |
| `database` | A03 (Injection) |
| `api` | A01, A05 (Misconfig) |
| `frontend` | A03 (XSS via Injection), A05 |
| `crypto` | A02 |

---

### 3. Security Toggles

Interrupteurs manuels pour forcer une règle OWASP même si non détectée automatiquement.

- État : `actif` (surligné) / `inactif` (grisé)
- Persistant dans la session
- Superposable avec la détection automatique (union des règles)

---

### 4. Injection de contraintes

Chaque règle OWASP injectée correspond à un bloc de texte standardisé ajouté au prompt.

**Bibliothèque de contraintes (exemples) :**

```
A01 — Access Control:
  "Vérifier l'authentification et les permissions avant toute action."

A02 — Crypto Failures:
  "Ne jamais stocker de mots de passe en clair. Utiliser bcrypt (cost ≥ 12) ou Argon2."

A03 — Injection:
  "Utiliser exclusivement des requêtes paramétrées. Aucune concaténation de chaînes SQL."

A04 — Insecure Design (Upload):
  "Valider le type MIME réel (pas l'extension), limiter la taille à 5Mo, renommer avec UUID."

A07 — Auth Failures:
  "Implémenter rate limiting sur les routes d'auth. Tokens JWT avec expiration courte."

A09 — Logging:
  "Logger les tentatives d'accès échouées sans exposer de données sensibles dans les logs."
```

---

### 5. Formatage de sortie (Copy for Claude / Copy for GPT)

Deux variantes du même prompt pour optimiser la compréhension du LLM cible.

**Format "Claude" :**
```
<task>
[intention reformulée]
</task>

<security_constraints>
[contraintes OWASP injectées, une par ligne]
</security_constraints>

<instructions>
Réponds uniquement avec du code sécurisé respectant toutes les contraintes ci-dessus.
Indique explicitement chaque contrainte respectée dans un commentaire en tête de fichier.
</instructions>
```

**Format "GPT/Cursor" :**
```
### Tâche
[intention reformulée]

### Contraintes de sécurité obligatoires
[contraintes OWASP, liste à puces]

### Instructions
Tu es en mode audit strict. Chaque ligne de code doit respecter les contraintes ci-dessus.
```

---

## Stack technique

> Philosophie : outil "one-feature" → zéro sur-ingénierie.

| Couche | Choix | Justification |
|--------|-------|---------------|
| **Frontend & Framework** | Next.js 15+ (App Router) | SSR léger, routing natif, écosystème React |
| **Styling** | Tailwind CSS v4 | Interface minimaliste, sombre (cyber-sécurité), génération ultra-rapide |
| **Prompt Engine** | Groq SDK ou Fireworks AI | Latence quasi nulle — modèle rapide (Llama 3.3 70B ou Mixtral) répond en < 500ms |
| **Base de connaissances** | `rules.json` (patterns OWASP 2025) | Pas de base de données — fichier plat suffisant en v1 |
| **Déploiement** | Vercel | Zero-config, edge-ready, intégration Next.js native |

---

## Architecture technique

```
src/
├── core/
│   ├── detector.ts       # Détection langage + domaine
│   ├── owasp-map.ts      # Mapping domaine → règles OWASP
│   ├── constraints.ts    # Bibliothèque de contraintes texte
│   └── prompt-builder.ts # Assemblage du prompt final
├── ui/
│   ├── SingleBox.tsx     # Composant principal
│   ├── Toggles.tsx       # Security toggles OWASP
│   └── OutputPanel.tsx   # Affichage + boutons copy
└── utils/
    └── clipboard.ts      # Formatage Claude vs GPT + copy
```

---

## Critères d'acceptance (v1)

- [ ] L'utilisateur tape une intention → un prompt sécurisé est généré en < 300ms (tout local, pas d'API call)
- [ ] Au moins 6 domaines détectés correctement sur les exemples types
- [ ] Les toggles OWASP s'additionnent à la détection auto sans doublon
- [ ] "Copy for Claude" produit un format XML structuré valide
- [ ] "Copy for GPT" produit un format Markdown lisible
- [ ] La détection et le domaine inféré sont affichés sous le prompt (transparence)

---

## Hors scope (v1)

- Pas d'appel LLM côté Hellmet (détection 100% locale)
- Pas de sauvegarde d'historique
- Pas de compte utilisateur
- Pas de personnalisation des contraintes OWASP
