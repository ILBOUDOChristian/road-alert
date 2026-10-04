# Guide du Backend ROADALERT : Construction Étape par Étape

Bienvenue dans le backend de ROADALERT ! 
Ce projet est construit de manière modulaire, étape par étape (ou branche par branche). Cette documentation t'explique l'ordre logique dans lequel les fonctionnalités sont empilées. Si tu es un développeur junior, lis ceci pour comprendre comment les pièces du puzzle s'assemblent.

---

## 🏗️ L'approche par "Couches" (Branches empilées)

Plutôt que de tout développer dans un seul gros bloc, le backend est découpé en **10 domaines fonctionnels**. Chaque domaine est construit au-dessus du précédent, comme des couches de briques.

Voici l'arbre de construction :

```text
Initapi (Le socle technique)
   │
   └── api-auth (Sécurité & Connexion)
          │
          └── api-users (Gestion des profils)
                 │
                 └── api-categories (Types d'anomalies)
                        │
                        └── api-reports (Cœur du métier : Signalements)
                               │
                               ├── api-uploads (Images & Fichiers)
                               │
                               └── api-agents (Équipes de terrain)
                                      │
                                      └── api-works (Interventions & Travaux)

Branches indépendantes (basées sur des couches stables) :
- api-map (Cartographie et zones)
- api-notifications (Alertes et messages)
- api-statistics (Tableau de bord et métriques)
```

---

## 🧱 Explication des Étapes (Domaines)

### Étape 0 : `Initapi` (La Fondation)
**Ce que c'est :** Le socle technique pur. Aucune règle métier n'est ici.
**Contenu :**
- Configuration de NestJS et Node.js.
- Connexion à la base de données PostgreSQL via TypeORM.
- Mise en place de Swagger (documentation `/docs`).
- Sécurité de base (CORS, Validation des données entrantes).

### Étape 1 : `api-auth` (La Sécurité)
**Ce que c'est :** Le système de portes et de clés de notre application.
**Contenu :**
- L'entité `User` (avec son email, son mot de passe chiffré par Bcrypt).
- La génération de **Tokens JWT** (pour dire "Je suis connecté").
- Les systèmes de rôles (`CITIZEN`, `AGENT`, `ADMIN`).
- Les routes `/auth/login` et `/auth/register`.

### Étape 2 : `api-users` (Les Profils)
**Ce que c'est :** La gestion des comptes humains.
**Contenu :**
- Modifier son profil, changer son mot de passe.
- Suppression de compte (ou plutôt "désactivation" / "archivage").
- Dépend directement du fait qu'on puisse être authentifié (`api-auth`).

### Étape 3 : `api-categories` (Le Référentiel)
**Ce que c'est :** Les types de problèmes qu'on peut signaler (ex: "Nid de poule", "Feu cassé").
**Contenu :**
- Créer, lire, modifier les catégories (géré par les administrateurs).
- Utilisé pour classer les signalements par la suite.

### Étape 4 : `api-reports` (Le Cœur du Métier)
**Ce que c'est :** Les signalements faits par les citoyens.
**Contenu :**
- Création d'un signalement par un citoyen.
- Liste des signalements, changements de statuts (En attente, En cours, Résolu).
- **Dépendance :** Un signalement est fait par un `User` et appartient à une `Category`.

### Étape 5 : `api-uploads` (Les Preuves)
**Ce que c'est :** L'ajout de photos ou de vidéos aux signalements.
**Contenu :**
- Upload de fichiers (stockés via RustFS/MinIO).
- Lier une image à un signalement existant.

### Étape 6 : `api-agents` (Les Opérateurs)
**Ce que c'est :** Les fonctionnalités réservées aux équipes techniques sur le terrain.
**Contenu :**
- Profils spécifiques pour les agents.
- Assignation d'un agent à une zone ou un type de problème.

### Étape 7 : `api-works` (Les Interventions)
**Ce que c'est :** Les travaux réalisés pour résoudre un signalement.
**Contenu :**
- Lier un agent à un signalement pour faire une réparation.
- Suivre la progression des travaux jusqu'à la résolution.

---

## 🛠️ Comment travailler sur ce projet ?

Si tu dois ajouter une fonctionnalité, demande-toi à quel domaine elle appartient.
1. **Regarde le schéma des branches.** Si tu modifies les signalements, tu sais que tu peux utiliser les données des `users` et des `categories`.
2. **Respecte le périmètre.** Ne mets pas de code d'upload d'image dans le module d'authentification.
3. **Teste toujours.** Chaque module est accompagné de ses tests unitaires.

## 🚀 Lancer le projet

```bash
# 1. Copie le fichier d'environnement
cp .env.example .env.dev

# 2. Lance avec Docker (inclut la Base de Données)
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build
```
- L'API sera sur `http://localhost:3001/api/v1`
- La documentation Swagger sur `http://localhost:3001/docs`
