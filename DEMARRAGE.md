# Guide de Démarrage Rapide (ROADALERT)

Ce document explique comment lancer l'ensemble des services sur votre machine de développement locale.

## 1. Démarrer l'infrastructure (Base de données & Nginx)

L'infrastructure locale s'appuie sur Docker. Assurez-vous que Docker Desktop est lancé.

```bash
# Depuis la racine du projet roadalert/
docker-compose -f docker-compose.dev.yml up -d db proxy
```
* **db** : Démarre PostgreSQL (exposé sur le port 5433).
* **proxy** : Démarre Nginx sur les ports 8081 et 4443 pour intercepter `api.roadalert.com`.

*(N'oubliez pas d'ajouter `127.0.0.1 api.roadalert.com admin.roadalert.com db.roadalert.com` dans votre fichier `C:\Windows\System32\drivers\etc\hosts`).*

## 2. Démarrer le Backend NestJS

Ouvrez un terminal dédié :

```bash
cd backend
npm run start:dev
```
Le backend va démarrer sur le port 3001 (en arrière-plan, Nginx redirige `api.roadalert.com:4443` vers ce port).
Le backend se connecte automatiquement à la base PostgreSQL locale via les identifiants configurés dans `.env.example`.

## 3. Accéder aux Services

Une fois l'infrastructure et le backend démarrés, voici vos accès locaux :

| Service | URL / Port | Description |
|---------|------------|-------------|
| **API REST** | `https://api.roadalert.com:4443` | Endpoint principal du backend |
| **Swagger UI** | `https://api.roadalert.com:4443/api/v1/docs` | Documentation OpenAPI |
| **Adminer** | `http://localhost:8888` | Client Web pour voir la base PostgreSQL |
| **Base de données**| `db.roadalert.com:5433` | Accès PostgreSQL direct |

## 4. Démarrer les Applications Flutter

Ouvrez un terminal dédié pour l'application de votre choix (un simulateur iOS/Android ou un navigateur Chrome doit être lancé) :

**Pour le mobile (Citoyen ou Agent) :**
```bash
cd frontend-mobile-citoyen
flutter run
```

**Pour le web (Admin) :**
```bash
cd frontend-admin-web
flutter run -d chrome
```
*(Le web admin sera accessible en local sur un port auto-assigné par Flutter, mais la configuration Nginx est déjà prête pour l'héberger sur **https://admin.roadalert.com** une fois compilé).*

---

## Commandes utiles

```bash
# Arrêter les containers
docker-compose -f docker-compose.dev.yml down

# Voir les logs du backend (si lancé via Docker)
docker-compose -f docker-compose.dev.yml logs -f backend

# Voir les logs de la base de données
docker-compose -f docker-compose.dev.yml logs -f db

# Générer une migration TypeORM
npm run typeorm migration:generate -- -n "description"

# Appliquer les migrations manuellement
npm run typeorm migration:run

# Lancer les tests unitaires backend
cd backend && npm run test

# Lancer les tests E2E backend
cd backend && npm run test:e2e

# Rebuild d'un seul service (ex: backend)
docker-compose -f docker-compose.dev.yml up -d --build backend

# Démarrage complet (avec build)
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## Développement local (sans Docker)

### Backend

```bash
cd backend
npm install

# Appliquer les migrations TypeORM
npm run typeorm migration:run

# Lancer l'API NestJS
npm run start:dev
```

### Frontend (Flutter Web)

```bash
cd frontend-admin-web
flutter pub get
flutter run -d chrome     # Serveur de dev
flutter build web         # Build PWA de production
```

---

## Notes importantes Docker Compose

> La base de données PostgreSQL conserve ses données localement grâce au volume Docker `db_data` défini dans `docker-compose.yml`. Si vous souhaitez réinitialiser complètement la BDD, utilisez la commande `docker-compose down -v`.

Si Docker Desktop n'est pas démarré sur Windows, l'erreur `npipe:////./pipe/dockerDesktopLinuxEngine` apparaît — elle est sans rapport avec la configuration Compose.

---

## Backlog & sprints

Le projet suit un backlog organisé par Epics et découpé en Sprints. Le backlog complet est géré directement sur GitHub Projects (ROADALERT BOARD).

| Livrable | Format |
|----------|--------|
| Cahier des Charges | `.docx` / `.pdf` |
| Conception Technique Backend | Markdown |
| Backlog | GitHub Projects (Table, Kanban, Roadmap) |
| Applications Mobiles | Flutter (Citoyen / Agent) |
| Web Admin | Flutter Web |

---

## Sécurité

- **Authentification** : JWT (JSON Web Tokens) + bcrypt pour le chiffrement des mots de passe.
- **RBAC (Role-Based Access Control)** : Contrôle granulaire des accès via Guards NestJS (ex: rôles `citoyen`, `agent`, `admin`).
- **Validation** : Validation stricte des données entrantes via `class-validator` (DTOs NestJS).
- **Scan de sécurité** : Workflows CI/CD GitHub Actions pour l'analyse des dépendances (`Trivy`) et la détection de secrets (`Trufflehog`).

---

## Structure du projet

```
roadalert/
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── common/           # Intercepteurs, filtres, guards globaux
│   │   ├── config/           # Configuration des variables d'environnement
│   │   ├── database/         # Module TypeORM
│   │   └── modules/          # Modules métiers (auth, users, reports, map...)
├── frontend-mobile-citoyen/  # Application Flutter (Citoyens)
├── frontend-mobile-agent/    # Application Flutter (Agents terrain)
├── frontend-admin-web/       # Application Flutter Web (Administration)
├── database/                 # Scripts SQL, initialisation spatiale (PostGIS)
├── docs/                     # Documentation fonctionnelle et architecture
├── scripts/                  # Scripts utilitaires (certificats, CI/CD locaux)
├── nginx/                    # Configuration Reverse Proxy & SSL
└── .github/                  # Workflows CI/CD & Templates (Issues, PR)
```
