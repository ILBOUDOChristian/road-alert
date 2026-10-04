# Documentation du Module : API Auth (`api-auth`)

## 1. Objectif du Module
Ce module constitue la porte d'entrée de l'application. Il gère l'inscription des citoyens (`/register`), la connexion via e-mail ou téléphone (`/login`), et le système de jetons de sécurité (JWT et Refresh Tokens) pour maintenir les sessions actives.

## 2. Principe de Fonctionnement
- **Stratégie JWT** : Lorsqu'un utilisateur se connecte, l'API lui renvoie un `accessToken` (valable 15 minutes) et un `refreshToken` (valable 7 jours).
- **Rotation des Refresh Tokens** : À chaque fois que le frontend appelle `/refresh` pour avoir un nouvel `accessToken`, l'ancien `refreshToken` est invalidé et remplacé par un nouveau. Cela augmente la sécurité.
- **Stockage Sécurisé** : Les mots de passe sont hachés avec `bcrypt` (12 rounds). Les refresh tokens sont stockés en base sous forme de hash SHA-256 (ils ne peuvent pas être relus en clair s'ils sont volés en base).

## 3. Endpoints

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| `POST` | `/api/v1/auth/register`| `PUBLIC` | Créer un compte avec rôle par défaut `CITIZEN`. |
| `POST` | `/api/v1/auth/login` | `PUBLIC` | Connexion. Accepte `email` ou `phone` dans le champ `identifier`. |
| `POST` | `/api/v1/auth/refresh` | `PUBLIC` | Renvoie de nouveaux jetons en échange d'un refresh token valide. |
| `POST` | `/api/v1/auth/logout` | `Bearer` | Invalide le refresh token de l'utilisateur. |
| `GET` | `/api/v1/auth/me` | `Bearer` | Renvoie le profil courant (sans le mot de passe). |

## 4. Tests Unitaires et Qualité

Le module est testé dans `auth.service.spec.ts`.
On y vérifie que le hachage fonctionne, que les connexions avec mauvais mots de passe sont rejetées (`UnauthorizedException`), et que la rotation des tokens s'effectue correctement.

**Note sur les tests et Bcrypt :**
Dans les tests, le "salt rounds" de Bcrypt est réduit à 1 (au lieu de 12 en production) pour accélérer considérablement l'exécution des tests.

## 5. Résolution de Bugs Communs (Troubleshooting)

### Problème : `401 Unauthorized` sur `/auth/me`
- **Cause probable** : Le token envoyé dans l'en-tête `Authorization: Bearer <token>` est expiré, mal formaté, ou absent.
- **Solution** : Vérifier dans l'onglet Network (Réseau) du navigateur ou dans le client REST (Postman, Swagger) que le token est bien présent et à jour. Si expiré, le frontend doit appeler `/refresh`.

### Problème : `401 Unauthorized` sur `/auth/refresh`
- **Cause probable** : Le refresh token envoyé n'existe plus en base (l'utilisateur s'est déconnecté) ou est compromis.
- **Solution** : L'utilisateur doit se reconnecter manuellement via `/login`.

### Problème : L'API répond lentement lors du `/login` ou `/register`
- **Cause probable** : L'algorithme Bcrypt (12 rounds) prend intentionnellement du temps pour se prémunir contre les attaques par force brute (environ 200 à 500ms par requête).
- **Solution** : C'est normal. Ne pas baisser les rounds en production.
