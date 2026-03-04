# Hellmet

**Un constructeur de prompts sécurisés pour les développeurs qui travaillent avec des LLMs.**

Hellmet prend une intention de code en langage naturel et la transforme en un prompt structuré et renforcé en sécurité, en injectant automatiquement les contraintes OWASP Top 10 pertinentes pour le domaine technique détecté.

---

## Sommaire

- [Pourquoi OWASP dès la conception](#pourquoi-owasp-dès-la-conception)
- [Comment ça marche](#comment-ça-marche)
- [Exemples](#exemples)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Lancer les tests](#lancer-les-tests)

---

## Pourquoi OWASP dès la conception

Les vulnérabilités de sécurité sont bien moins coûteuses à corriger lorsqu'elles sont traitées dès la phase de conception. L'OWASP Top 10 est la classification de référence des risques les plus critiques en sécurité des applications web — pourtant, dans la pratique, elle n'est consultée qu'après un incident ou un audit.

Lorsque les développeurs utilisent des LLMs pour générer du code, ils fournissent généralement des prompts courts et orientés objectif : *"crée une route d'authentification"*, *"ajoute un formulaire d'upload"*. Ces prompts ne contiennent aucun contexte de sécurité. Le modèle produit un code fonctionnel, mais les contraintes de sécurité sont laissées au hasard ou à une revue a posteriori.

Hellmet comble ce manque à la source. Avant que le prompt n'atteigne le LLM, il est enrichi avec les contraintes OWASP précises correspondant au domaine technique détecté. Le développeur n'a pas besoin de mémoriser la classification OWASP — l'outil fait la correspondance automatiquement et l'injecte sous forme de bloc de contraintes lisible par la machine.

Le principe est simple : **si les exigences de sécurité sont dans le prompt, le modèle est contraint d'en tenir compte**.

---

## Comment ça marche

1. Le développeur saisit une intention de code en texte libre.
2. Hellmet détecte le langage de programmation et les domaines techniques (authentification, base de données, upload, API, frontend, cryptographie).
3. Les règles OWASP pertinentes sont sélectionnées et triées par sévérité (critiques en premier).
4. L'intention est réécrite sous forme de prompt structuré dans deux formats : Claude XML et GPT Markdown.
5. Optionnellement, le prompt est enrichi par un LLM hébergé sur Groq (Llama 3.3 70B) agissant strictement comme rééditeur de prompt — pas comme générateur de code.

---

## Exemples

### Entrée

> Create a Node.js route that handles file uploads from authenticated users and stores them on S3.

### Domaines détectés

`api`, `upload`, `auth`

### Règles OWASP injectées

| Règle | Sévérité | Contrainte |
|-------|----------|------------|
| A01 — Contrôle d'accès | critique | Vérifier l'authentification et l'autorisation avant toute action. |
| A02 — Défaillances cryptographiques | critique | Utiliser TLS pour tous les transferts ; ne jamais exposer les credentials dans les logs ou les réponses. |
| A04 — Conception non sécurisée | haute | Valider le vrai type MIME du fichier, pas seulement l'extension. Imposer une taille maximale. |
| A07 — Identification et authentification | haute | Valider le token de session à chaque requête ; l'invalider à la déconnexion. |
| A08 — Intégrité des données et des logiciels | haute | Vérifier l'intégrité des fichiers uploadés ; rejeter tout contenu exécutable. |
| A06 — Composants vulnérables | moyenne | Auditer toutes les dépendances tierces utilisées dans cette fonctionnalité. |

### Prompt Claude XML généré

```xml
<task>
Create a Node.js route that handles file uploads from authenticated users and stores them on S3.
</task>

<security_constraints>
[A01 — Access Control] Verify authentication and authorization before any action.
[A02 — Cryptographic Failures] Use TLS for all transfers; never expose credentials in logs or responses.
[A04 — Insecure Design] Validate the real MIME type of the file, not just the extension. Enforce maximum file size.
[A07 — Identification and Auth] Validate the session token on every request; invalidate it on logout.
[A08 — Software and Data Integrity] Verify the integrity of uploaded files; reject executable content.
[A06 — Vulnerable Components] Audit all third-party dependencies used in this feature.
</security_constraints>

<instructions>
Reply only with secure code that satisfies all the constraints above.
Explicitly acknowledge each constraint in a comment at the top of the file.
</instructions>
```

---

### Autre exemple

**Entrée :** *"Add a password reset form with email verification"*

**Domaines détectés :** `auth`, `frontend`

**Règles injectées :** A02 (hacher les mots de passe avec bcrypt, imposer une entropie minimale), A07 (limiter le débit des tentatives de réinitialisation, expirer les tokens après 15 minutes), A03 (assainir toutes les entrées utilisateur avant rendu).

Le développeur colle le prompt généré directement dans Claude, ChatGPT ou Cursor. Le modèle reçoit les exigences de sécurité comme des contraintes dures, non comme des suggestions optionnelles.

---

## Fonctionnalités

- Détection automatique du domaine à partir du texte libre (langage + contexte technique)
- Couverture complète de l'OWASP Top 10 (2021) avec niveaux de sévérité
- Surcharge manuelle des règles via des boutons de bascule
- Deux formats de sortie : Claude XML et GPT Markdown
- Sélecteur de langue de sortie FR / EN
- Enrichissement IA via Groq (Llama 3.3 70B) — réécrit sans exécuter
- Historique de session (5 derniers prompts, stockés localement)
- Raccourci clavier : `Ctrl+Entrée` pour générer

---

## Installation

**Prérequis :** Node.js 20+, npm 10+

```bash
git clone https://github.com/your-org/hellmet.git
cd hellmet
npm install
```

Copiez le fichier d'environnement et ajoutez votre clé API Groq (requise uniquement pour l'enrichissement IA — le constructeur de prompts principal fonctionne sans) :

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

Ouvrez [http://localhost:3000](http://localhost:3000).

---

## Lancer les tests

```bash
npm test
```

La suite de tests couvre tous les modules principaux (`detector`, `prompt-builder`, `owasp-map`) ainsi que les composants UI à logique conditionnelle (`OutputPanel`, `Toggles`).

```bash
npm run test:watch   # mode surveillance
```
