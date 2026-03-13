# Aide & Support

## Objectif

Fournir un point d’entrée unique pour l’assistance des utilisateurs (étudiants,
enseignants, scolarité, administration), avec un accès rapide au support et des
informations d’aide contextualisées.

## Portée V1

- Lien rapide “Aide/Support” dans le header global.
- Page `/support` avec informations d’aide et accès au support.
- Contact support via email (adresse configurable).
- Préparation d’un espace d’aide (FAQ + guides courts) pour V2.

## Accès & RBAC

- Tous les profils peuvent accéder au support.
- Les échanges support doivent être journalisés côté back-office (V2).

## RBAC (reference)
Voir les regles detaillees et la matrice des permissions: `roles-rules.md`.

## Parcours utilisateur (V1)

1. L’utilisateur clique sur “Aide/Support” depuis le header.
2. Accès à la page `/support` avec FAQ et CTA.
3. Ouverture du client mail avec l’adresse de support et un sujet prérempli.

## Détails techniques (V1)

- UI: bouton “Aide/Support” dans `AppHeaderComponent`.
- Route: `/support` (standalone component).
- CTA: `mailto:` via `SUPPORT_EMAIL` dans `apps/web/src/app/core/app-settings.ts`.
- Statut service: texte configurable dans `apps/web/src/app/core/app-settings.ts`.
- Mobile: même action dans le menu responsive.

## Évolutions prévues (V2)

- Page `/support` avec FAQ, guides courts et formulaire.
- Intégration tickets (ID, statut, historique).
- SLA, priorités, et base de connaissances.
