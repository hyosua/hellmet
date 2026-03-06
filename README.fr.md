# Hellmet

**Un analyseur statique de vulnérabilités de code basé sur l'OWASP Top 10 (2025).**

hellmet scanne un snippet de code pour y détecter des failles de sécurité à l'aide de patterns regex côté client, regroupe les résultats par règle OWASP, et génère un prompt XML de correction prêt à coller dans n'importe quel LLM.

Un outil secondaire — le Prompt Builder — permet d'ajouter un contexte de sécurité à une intention de code en langage naturel. Il est accessible à `/prompt`.

---

## Sommaire

- [Pourquoi analyser le code avant de prompter](#pourquoi-analyser-le-code-avant-de-prompter)
- [Comment ça marche](#comment-ça-marche)
- [Exemples](#exemples)
- [Patterns détectés](#patterns-détectés)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Lancer les tests](#lancer-les-tests)

---

## Pourquoi analyser le code avant de prompter

Le code généré par les LLMs est fonctionnel par défaut, sécurisé par accident. Lorsque les développeurs collent des snippets générés par IA dans leur base de code sans relecture, les vulnérabilités courantes — injection SQL, secrets codés en dur, JWT sans expiration, blocs catch vides — passent inaperçues.

Hellmet comble ce manque avant que le patch n'atteigne la production. Collez le code, obtenez un rapport de vulnérabilités annoté, puis collez le prompt de correction généré directement dans Claude ou ChatGPT. Le modèle reçoit les contraintes OWASP exactes qui s'appliquent, et non une instruction générique "rends ça sécurisé".

Le principe : **nommer la vulnérabilité, citer la règle, obtenir un correctif ciblé**.

---

## Comment ça marche

### Code Analyzer (feature principale — `/`)

1. Collez un snippet de code dans la zone de saisie.
2. Cliquez sur **Analyser** — la détection s'exécute entièrement côté client, de façon synchrone.
3. Les correspondances sont regroupées par règle OWASP (A01–A10), avec numéro de ligne, snippet et explication.
4. Les toggles OWASP concernés sont activés automatiquement (grisés — auto-détectés).
5. Cliquez sur **Générer le prompt de correction** — produit un prompt XML structuré avec le bloc de code original et les contraintes applicables triées par sévérité.
6. Copiez et collez dans votre LLM.

### Prompt Builder (feature secondaire — `/prompt`)

Saisissez une intention de code en texte libre. Hellmet détecte le domaine technique et le langage, les mappe vers des règles OWASP, et génère un prompt durci. Utile avant d'écrire du code plutôt qu'après.

---

## Exemples

### Entrée (Code Analyzer)

```php
$user_id = $_GET['user_id'];
$query = "SELECT * FROM users WHERE id = $user_id";
$result = mysqli_query($conn, $query);
```

### Vulnérabilités détectées

| Règle | Pattern | Ligne | Constat |
|-------|---------|-------|---------|
| A05 — Injection | `sql-php-interpolation` | 2 | Interpolation de variable PHP dans une chaîne SQL |

### Prompt de correction généré

```xml
<task>
Corrige les vulnérabilités de sécurité dans le code ci-dessous.
</task>

<code>
$user_id = $_GET['user_id'];
$query = "SELECT * FROM users WHERE id = $user_id";
$result = mysqli_query($conn, $query);
</code>

<security_constraints>
[A05 — Injection] Utiliser exclusivement des requêtes paramétrées ou un ORM.
Aucune concaténation de chaînes pour construire des requêtes SQL.
</security_constraints>

<instructions>
Réponds uniquement avec le code corrigé. Pour chaque modification, ajoute un
commentaire inline expliquant la correction OWASP.
</instructions>
```

---

### Autre exemple

**Entrée :**
```javascript
const token = jwt.sign({ userId: user.id }, SECRET);
const secret = "hardcoded_api_key_123";
```

**Détecté :** A07 (`jwt-no-expiry`) + A04 (`hardcoded-secret`)

**Le prompt de correction** inclut les deux règles triées par sévérité (A04 critique avant A07 critique), avec le bloc de code original intégré dans `<code>`.

---

## Patterns détectés

19 patterns répartis sur 6 catégories OWASP :

| Pattern | Règle | Cible |
|---------|-------|-------|
| `sql-template-literal` | A05 | Template literal JS avec SQL et `${` |
| `sql-php-interpolation` | A05 | Double quotes PHP avec SQL et `$var` |
| `sql-string-concat` | A05 | Variable concaténée dans une chaîne SQL |
| `eval-call` | A05 | `eval(` |
| `innerHTML-assign` | A05 | `.innerHTML =` |
| `dangerously-set-html` | A05 | `dangerouslySetInnerHTML={{` |
| `document-write` | A05 | `document.write(` |
| `hardcoded-secret` | A04 | `secret/password/token/key = "..."` |
| `math-random-token` | A04 | `Math.random()` |
| `md5-usage` | A04 | `md5(` |
| `sha1-usage` | A04 | `sha1(` |
| `hardcoded-credentials` | A07 | `username/user/password = "..."` |
| `jwt-no-expiry` | A07 | `jwt.sign(` sans `expiresIn` dans le scope |
| `cors-wildcard` | A02 | `origin: '*'` |
| `debug-true` | A02 | `debug: true` |
| `httponly-false` | A02 | `httpOnly: false` |
| `unsafe-json-parse` | A08 | `JSON.parse(req.` |
| `password-in-log` | A09 | `console.log(... password/token/secret)` |
| `empty-catch` | A10 | `catch(e) {}` |

La détection est entièrement côté client (regex, synchrone). Aucun appel serveur, aucune dépendance externe.

---

## Fonctionnalités

**Code Analyzer (`/`)**
- Détection statique : 19 patterns, 6 catégories OWASP, instantanée
- Rapport groupé par règle avec numéro de ligne, snippet et explication (FR/EN)
- Toggles OWASP auto-activés à la détection, surchargeables manuellement
- Prompt de correction : XML avec bloc `<code>` + contraintes triées par sévérité
- Copie dans le presse-papier

**Prompt Builder (`/prompt`)**
- Détection du domaine depuis le texte libre (11 langages, 6 domaines)
- Injection des règles OWASP Top 10 (2025) triées par sévérité
- Surcharge manuelle via toggles, historique de session (5 derniers prompts)
- Enrichissement IA optionnel via Groq (Llama 3.3 70B)

**Les deux outils**
- Sélecteur FR / EN
- Thème sombre / clair
- OWASP Top 10 — 2025

---

## Installation

**Prérequis :** Node.js 20+, npm 10+

```bash
git clone https://github.com/your-org/hellmet.git
cd hellmet
npm install
```

Copiez le fichier d'environnement et ajoutez votre clé API Groq (requise uniquement pour l'enrichissement IA — l'analyseur et le Prompt Builder fonctionnent sans) :

```bash
cp .env.example .env.local
```

```env
GROQ_API_KEY=votre_clé_ici
```

Démarrez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour le Code Analyzer.
Ouvrez [http://localhost:3000/prompt](http://localhost:3000/prompt) pour le Prompt Builder.

---

## Lancer les tests

```bash
npm test
```

La suite de tests couvre tous les modules principaux (`code-analyzer`, `detector`, `prompt-builder`, `owasp-map`) ainsi que les composants UI (`OutputPanel`, `Toggles`).

74 tests — unitaires + composants.
