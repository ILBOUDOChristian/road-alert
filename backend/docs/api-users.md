# Documentation du Module : API Users (`api-users`)

## 1. Objectif du Module
Ce module gère le cycle de vie des profils utilisateurs une fois qu'ils sont inscrits dans le système. Il s'appuie fortement sur l'authentification (`api-auth`) pour identifier la personne connectée.
Il permet à un utilisateur de modifier ses informations personnelles (prénom, nom, téléphone, mot de passe) et aux administrateurs de gérer l'ensemble des comptes (suspension, changement de rôle).

## 2. Principe de Fonctionnement
- **Controller (`users.controller.ts`)** : Expose les routes REST. Il vérifie que l'utilisateur est bien authentifié via `@UseGuards(JwtAuthGuard)`. Il vérifie également les droits : un utilisateur normal ne peut toucher qu'à son **propre ID**. Un Admin peut toucher à tout.
- **Service (`users.service.ts`)** : Contient la logique métier (par exemple, la vérification de l'ancien mot de passe avant d'en enregistrer un nouveau, ou la vérification que le nouveau numéro de téléphone n'est pas déjà pris).
- **DTOs (`dto/*.dto.ts`)** : Valident strictement les données entrantes. Si quelqu'un envoie un mot de passe trop court, l'API renverra automatiquement une erreur `400 Bad Request`.

## 3. Endpoints

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| `GET` | `/api/v1/users` | `ADMIN` | Liste tous les utilisateurs (avec filtres et pagination). |
| `GET` | `/api/v1/users/:id` | Propriétaire ou `ADMIN` | Voir un profil détaillé. |
| `PATCH` | `/api/v1/users/:id` | Propriétaire ou `ADMIN` | Modifier (prénom, nom, téléphone). |
| `PUT` | `/api/v1/users/:id/password` | Propriétaire ou `ADMIN` | Changer de mot de passe (nécessite l'ancien). |
| `DELETE`| `/api/v1/users/:id` | Propriétaire ou `ADMIN` | Désactiver le compte (Statut = `INACTIVE`). |
| `PATCH` | `/api/v1/users/:id/role` | `ADMIN` | Changer le rôle d'un compte. |
| `PATCH` | `/api/v1/users/:id/status`| `ADMIN` | Bloquer ou réactiver un compte. |

## 4. Tests Unitaires et Qualité

Le module est couvert par **Jest** (`users.service.spec.ts`).
Les tests vérifient les cas de succès mais surtout les cas d'erreur (ex: on s'assure qu'une erreur `ForbiddenException` est levée si l'ancien mot de passe est mauvais).

**Comment relancer ces tests en cas de modification ?**
```bash
npm run test:watch
# Choisir p pour filtrer par nom de fichier, et taper "users"
```

## 5. Résolution de Bugs Communs (Troubleshooting)

### Problème : `403 Forbidden` lors de la modification d'un profil
- **Cause probable** : L'ID passé dans l'URL (`/api/v1/users/123`) ne correspond pas à l'ID du token JWT (celui qui a fait la requête), et l'utilisateur n'est pas ADMIN.
- **Solution** : Vérifie que le frontend envoie bien l'ID du profil courant récupéré via `/auth/me`.

### Problème : `409 Conflict` lors de la mise à jour du numéro de téléphone
- **Cause probable** : Un autre compte utilise déjà ce numéro.
- **Solution** : Le frontend doit inviter l'utilisateur à saisir un autre numéro. C'est le comportement attendu.

### Problème : Le mot de passe ne se met pas à jour
- **Cause probable** : L'ancien mot de passe fourni ne match pas le hash en base, ou le nouveau mot de passe fait moins de 8 caractères (bloqué par le DTO).
- **Solution** : Lire le message d'erreur retourné dans le JSON (`message` array).
