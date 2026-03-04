# Feature Specification: Hellmet — Secure Prompt Box

**Feature Branch**: `001-secure-prompt-box`
**Created**: 2026-03-04
**Status**: Draft
**Input**: Interface unique qui transforme une intention brute en prompt sécurisé prêt à coller dans un LLM.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Transformer une intention en prompt sécurisé (Priority: P1)

Un développeur décrit en langage naturel ce qu'il veut coder. Hellmet analyse le texte, détecte automatiquement le langage et le domaine technique, injecte les contraintes OWASP correspondantes, et lui présente un prompt durci prêt à coller dans son LLM.

**Why this priority**: C'est la fonctionnalité centrale — sans elle, rien d'autre n'a de valeur. Elle seule délivre la proposition de valeur principale de l'outil.

**Independent Test**: Peut être testé de bout en bout en saisissant une intention (`"Crée une route d'upload d'images en Node"`) et en vérifiant que la sortie contient les contraintes OWASP A01 et A04 sans aucune interaction supplémentaire.

**Acceptance Scenarios**:

1. **Given** un utilisateur tape `"Crée une route d'api pour uploader des images en Node"`, **When** il soumet l'intention, **Then** le système détecte `Node.js` + `upload`, injecte A01 et A04, et produit un prompt sécurisé contenant les contraintes correspondantes.
2. **Given** une intention vide, **When** l'utilisateur soumet le formulaire, **Then** aucun prompt n'est généré et un message d'erreur invite l'utilisateur à décrire son intention.
3. **Given** une intention ambiguë sans domaine reconnu, **When** elle est soumise, **Then** aucune règle OWASP n'est injectée automatiquement et l'utilisateur voit un message indiquant qu'aucun domaine n'a été détecté.

---

### User Story 2 — Forcer des règles OWASP via les toggles (Priority: P2)

L'utilisateur veut s'assurer qu'une contrainte OWASP spécifique est toujours injectée, même si le système ne la détecte pas automatiquement. Il active manuellement un toggle OWASP avant ou après avoir soumis son intention.

**Why this priority**: Les toggles permettent de couvrir les cas où la détection automatique est insuffisante et d'adapter le prompt aux besoins de sécurité du projet.

**Independent Test**: Peut être testé en activant le toggle A07 sur une intention de type `"créer un composant de formulaire"` (domaine `frontend`) et en vérifiant que A07 apparaît bien dans les règles injectées, en plus de A03 et A05.

**Acceptance Scenarios**:

1. **Given** un toggle OWASP est activé manuellement, **When** l'utilisateur soumet son intention, **Then** la règle du toggle est ajoutée aux règles détectées automatiquement, sans doublon.
2. **Given** un toggle est activé et correspond à une règle déjà détectée automatiquement, **When** le prompt est généré, **Then** la contrainte n'apparaît qu'une seule fois dans la sortie.
3. **Given** un toggle est activé, **When** l'utilisateur soumet plusieurs intentions successives, **Then** l'état des toggles persiste pendant toute la session.

---

### User Story 3 — Copier le prompt dans le bon format (Priority: P3)

L'utilisateur veut copier le prompt généré dans le format adapté à son LLM cible (Claude ou GPT/Cursor) en un seul clic.

**Why this priority**: La friction de copie-colle est le dernier obstacle entre l'outil et l'usage réel. Un bouton dédié par format élimine ce frein.

**Independent Test**: Peut être testé en générant un prompt et en cliquant sur "Copy for Claude", puis en vérifiant que le presse-papier contient un prompt XML valide avec les balises `<task>`, `<security_constraints>` et `<instructions>`.

**Acceptance Scenarios**:

1. **Given** un prompt est généré, **When** l'utilisateur clique sur "Copy for Claude", **Then** le presse-papier contient le prompt formaté en XML structuré avec les trois balises requises.
2. **Given** un prompt est généré, **When** l'utilisateur clique sur "Copy for GPT", **Then** le presse-papier contient le prompt formaté en Markdown avec les sections `### Tâche`, `### Contraintes de sécurité obligatoires` et `### Instructions`.
3. **Given** un clic sur un bouton de copie, **When** la copie réussit, **Then** l'utilisateur reçoit un retour visuel confirmant la copie (ex: texte "Copié !" pendant 2 secondes).

---

### Edge Cases

- Que se passe-t-il si l'intention contient des mots-clés de plusieurs domaines (ex: `"route d'auth avec upload d'avatar"`) ? → les règles des deux domaines sont unionnées sans doublon.
- Que se passe-t-il si le navigateur ne supporte pas l'API Clipboard ? → bouton de copie désactivé avec message explicatif.
- Que se passe-t-il si l'intention contient uniquement du code (pas de description) ? → traitement normal, pas de refus.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT détecter le langage de programmation à partir du texte libre (Python, JavaScript, TypeScript, Node.js, SQL, Go, Rust, PHP, Java, C#, Bash).
- **FR-002**: Le système DOIT détecter le domaine technique à partir de mots-clés (api, auth, upload, database, frontend, crypto).
- **FR-003**: Le système DOIT mapper automatiquement le domaine détecté aux règles OWASP 2025 correspondantes.
- **FR-004**: Le système DOIT permettre à l'utilisateur d'activer ou désactiver manuellement chaque règle OWASP via des toggles.
- **FR-005**: Le système DOIT unifier les règles issues de la détection automatique et des toggles manuels sans doublon.
- **FR-006**: Le système DOIT générer un prompt sécurisé entièrement côté client (aucun appel API externe requis pour la génération de base).
- **FR-007**: Le système DOIT produire deux variantes de sortie : format Claude (XML structuré) et format GPT/Cursor (Markdown).
- **FR-008**: Le système DOIT afficher les métadonnées de détection sous le prompt : langage inféré, domaine détecté, règles OWASP injectées.
- **FR-009**: Le système DOIT proposer un bouton de copie par variante de sortie avec retour visuel de confirmation.

### Key Entities

- **Intention**: Le texte libre saisi par l'utilisateur décrivant ce qu'il veut coder.
- **Détection**: Le résultat de l'analyse de l'intention — contient le langage et le domaine identifiés.
- **Règle OWASP**: Un identifiant (A01–A09) associé à un bloc de contrainte textuelle standardisée.
- **Prompt sécurisé**: L'intention reformulée avec les contraintes OWASP injectées, disponible en deux formats.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un prompt sécurisé est généré en moins de 300ms après soumission d'une intention (traitement entièrement local).
- **SC-002**: Au moins 6 domaines techniques distincts (parmi : api, auth, upload, database, frontend, crypto) sont détectés correctement sur des exemples types représentatifs.
- **SC-003**: Les toggles OWASP activés manuellement s'additionnent à la détection automatique sans produire de doublons dans le prompt généré.
- **SC-004**: Le format "Copy for Claude" produit systématiquement un XML structuré valide avec les trois balises requises (`<task>`, `<security_constraints>`, `<instructions>`).
- **SC-005**: Le format "Copy for GPT" produit systématiquement un Markdown lisible avec les trois sections requises.
- **SC-006**: 100% des générations affichent les métadonnées de détection (langage, domaine, règles injectées) sous le prompt.

---

## Assumptions

- La détection de langage et de domaine est réalisée par matching de mots-clés (pas de NLP externe) en v1.
- L'interface est en langue française, destinée à des développeurs francophones.
- Pas de persistance de données entre sessions (pas d'historique, pas de compte utilisateur).
- La bibliothèque de contraintes OWASP est figée en v1 (pas de personnalisation par l'utilisateur).
- L'appel au moteur LLM (Groq/Fireworks) est optionnel — la génération de prompt fonctionne sans connexion grâce au moteur de règles local.

---

## Out of Scope (v1)

- Historique des prompts générés
- Comptes utilisateurs ou authentification
- Personnalisation des contraintes OWASP
- Détection via NLP ou modèle de langage externe
- Export vers d'autres formats (PDF, Notion, etc.)
