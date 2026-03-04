# Hellmet: Secure Prompt Box Constitution

## Core Principles

### I. Single Page First
L'interface doit être conçue comme une expérience unique et épurée sur une seule page. Aucun rechargement ou navigation complexe ne doit interrompre le flux de sécurisation du prompt. L'accent est mis sur la clarté et l'efficacité visuelle.

### II. Latency is King (Instant Hardening)
Le traitement de l'intention brute vers le prompt durci doit paraître instantané pour l'utilisateur. L'objectif de performance est une transformation locale en moins de 300ms (SC-001). Le moteur de règles doit privilégier la rapidité d'exécution côté client.

### III. Security-Driven (OWASP First)
Le système agit en tant qu'expert sécurité. Chaque prompt généré doit obligatoirement intégrer les contraintes de sécurité OWASP pertinentes au domaine détecté. La conformité aux standards de sécurité n'est pas optionnelle ; elle est la raison d'être de l'outil.

### IV. Local Transformation Reliability
La génération de base du prompt sécurisé doit fonctionner entièrement côté client, sans dépendance obligatoire à un service tiers (FR-006). L'intelligence de détection par mots-clés (v1) assure une disponibilité constante et une confidentialité maximale des intentions saisies.

### V. Multi-Format Output
L'outil doit reconnaître la diversité des écosystèmes LLM en fournissant systématiquement des sorties optimisées pour les deux standards du marché : XML structuré pour Claude et Markdown pour GPT/Cursor.

## Technical Constraints & Stack

### Frontend & Styling
- **Framework** : Next.js (App Router) avec TypeScript pour une robustesse maximale.
- **Design** : Tailwind CSS avec une esthétique "Cyber/Dark Mode".
- **Iconographie** : Lucide React.
- **Interactivité** : Retour visuel immédiat pour chaque action (copie, détection, toggle).

### Logic & Processing
- **Moteur de règles** : Logique de détection par Regex et mapping de domaines technique locale.
- **API (Optionnel)** : Groq ou Cloudflare Workers pour le raffinage LLM avancé uniquement si la connectivité le permet.

## Quality Gates & Validation

### Verification Scenarios
Toute modification du moteur de transformation doit être validée par les scénarios d'acceptation définis dans la spécification :
1. Détection correcte du langage et du domaine technique.
2. Unification sans doublon des règles automatiques et des toggles manuels.
3. Validité syntaxique des formats de sortie (XML pour Claude, MD pour GPT).

### Performance Standards
- Temps de réponse UI : < 100ms pour les interactions de base.
- Temps de génération de prompt : < 300ms.

## Governance

Le présent document de constitution prévaut sur les décisions d'implémentation ad hoc. Toute déviation majeure par rapport aux principes de performance ou de sécurité doit être justifiée et documentée.

**Version**: 1.0.0 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-03-04
