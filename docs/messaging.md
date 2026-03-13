# Module Messagerie (MVP)

## Objectif
Offrir une messagerie interne simple (1-1 + groupes) avec pièces jointes basiques.

## Fonctionnalites
- Conversations directes (1-1).
- Groupes de discussion (>= 3 participants).
- Envoi de messages texte.
- Upload de pieces jointes (PDF/PNG/JPEG, 10MB).
- Consultation des conversations/messages pour les membres.

## Endpoints (API)
- `GET /api/messages/conversations`
- `POST /api/messages/conversations/direct`
- `POST /api/messages/conversations/group`
- `GET /api/messages/conversations/:id/messages`
- `POST /api/messages/conversations/:id/messages`
- `POST /api/messages/attachments?conversationId=...`
- `GET /api/messages/attachments/:id/download`

## Regles d'acces
- Authentification obligatoire (JWT).
- Un utilisateur ne peut voir que ses conversations.
- Upload/telechargement reserve aux participants de la conversation.

## RBAC (reference)
Voir les regles detaillees et la matrice des permissions: `roles-rules.md`.

## Audit log
Actions journalisees:
- `messaging.conversation.create`
- `messaging.group.create`
- `messaging.message.create`
- `messaging.attachment.create`

## UI
- Page ` /messages ` avec liste des conversations et fil des messages.
- Creation de conversation directe et de groupe.
- Upload de pieces jointes et envoi de messages.
