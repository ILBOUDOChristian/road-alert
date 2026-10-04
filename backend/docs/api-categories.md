# Documentation du Module : API Categories (`api-categories`)

## 1. Objectif du Module
Ce module sert de référentiel pour les types de signalements (ex: "Nid de poule", "Feu défectueux").
Les catégories sont gérées par les administrateurs et utilisées par tous les autres pour qualifier un problème.

## 2. Principe de Fonctionnement
- **Controller (`categories.controller.ts`)** : Expose les routes REST. La lecture globale (`GET /api/v1/categories`) est accessible à tout le monde. L'écriture (`POST`, `PATCH`, `DELETE`) est stricte et limitée aux profils `ADMIN` (via `@Roles(UserRole.ADMIN)`).
- **Service (`categories.service.ts`)** : Logique métier. Empêche la création de deux catégories avec le même nom (`ConflictException`). Gère le **soft delete** : la méthode `remove()` passe simplement la propriété `isActive` à `false` plutôt que d'effacer la ligne de la base, pour ne pas casser l'historique des anciens signalements.
- **DTOs (`dto/*.dto.ts`)** : Valide notamment que la `color` fournie est bien un format hexadécimal (#FF0000).

## 3. Endpoints

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| `GET` | `/api/v1/categories` | `Bearer` | Liste toutes les catégories actives. Accepte `?includeInactive=true`. |
| `GET` | `/api/v1/categories/:id` | `Bearer` | Détail d'une catégorie. |
| `POST` | `/api/v1/categories` | `ADMIN` | Créer une catégorie. |
| `PATCH` | `/api/v1/categories/:id` | `ADMIN` | Modifier une catégorie (nom, description, couleur). |
| `DELETE`| `/api/v1/categories/:id` | `ADMIN` | Désactiver une catégorie (soft delete). |

## 4. Tests Unitaires et Qualité

Le module est couvert par **Jest** (`categories.service.spec.ts`).

**Comment relancer ces tests en cas de modification ?**
```bash
npm run test:watch
# Choisir p pour filtrer par nom de fichier, et taper "categories"
```

## 5. Résolution de Bugs Communs (Troubleshooting)

### Problème : `409 Conflict` à la création ou modification
- **Cause probable** : Tu essaies de créer une catégorie ou de renommer une catégorie vers un nom qui existe déjà en base de données.
- **Solution** : Le nom doit être unique. Change le nom proposé.

### Problème : `400 Bad Request` sur le champ `color`
- **Cause probable** : La couleur fournie n'est pas un code hexadécimal valide (ex: "rouge" ou "#FF" ne passeront pas).
- **Solution** : Envoie une couleur au format #RRGGBB ou #RGB.
