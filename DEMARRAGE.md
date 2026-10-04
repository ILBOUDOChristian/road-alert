# Démarrage de ROADALERT

## Prérequis

- Docker Desktop démarré avec Docker Compose v2.
- PowerShell ouvert à la racine du dépôt pour utiliser la commande unique.
- Flutter installé seulement pour lancer les applications mobiles ou développer le frontend hors Docker.

## Démarrer toute la pile web en une commande

Depuis PowerShell, à la racine du dépôt, exécuter cette commande pour démarrer toute la pile :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build
```

Cette commande exacte démarre toute la pile au premier plan et construit les images. Le service Compose `startup-info` attend que le proxy et ses dépendances soient sains, puis affiche `SUCCES`, les URL par domaine et enfin toutes les URL `localhost`. Les liens sont cliquables dans le terminal VS Code; les URL localhost se trouvent à la fin des logs pour rester visibles dans leur aperçu. Les autres services restent attachés au terminal pour afficher leurs logs. `Ctrl+C` arrête la pile.

`ps` ne démarre rien : il affiche seulement l'état des conteneurs déjà créés. Si son résultat ne contient que les en-têtes, aucun conteneur du projet n'est actuellement démarré. `down`, lui, arrête et supprime les conteneurs, ce qui explique que `ps` soit vide après cette commande.

Le fichier `.env.dev` doit exister à la racine avant l'exécution. Il est déjà présent dans ce dépôt local. S'il est absent dans une nouvelle copie du projet, créer une copie du modèle local :

```powershell
Copy-Item .env.example .env.dev
```

Vérifier ensuite les valeurs locales dans `.env.dev`. Ne pas écraser ce fichier s'il contient déjà vos réglages. `APP_URL=http://roadalert.com` est l'origine du site; `API_URL=http://roadalert.com/api/v1` est l'adresse complète de l'API. `API_PREFIX=api/v1` configure le préfixe des routes NestJS. CORS reçoit seulement les origines, sans chemin.

Compose affiche la progression et l'état des conteneurs, mais n'imprime pas automatiquement les URL. Les deux modes d'accès cliquables sont listés ci-dessous.

Compose crée le réseau et les volumes, initialise PostgreSQL/PostGIS, puis démarre Redis, RustFS (stockage compatible S3), l'API NestJS, le frontend admin Flutter Web, Nginx et Adminer. RustFS remplace l'ancienne image MinIO, qui n'est plus accessible depuis le registre Docker Hub sans authentification. Le service conserve le nom réseau `minio` afin que l'API garde son endpoint S3 interne. Le fichier `docker-compose.dev.yml` active les ports locaux et le hot-reload du backend.

Le service web à `localhost:8080` est le frontend admin Flutter, actuellement encore sur l'écran de démonstration « Flutter Demo ». Swagger permet de consulter l'API NestJS, mais celle-ci ne contient pas encore de routes CRUD métier. Adminer et la console RustFS sont des interfaces séparées. Le backoffice métier sera développé en interne avec Flutter Web et NestJS; son périmètre est décrit dans [docs/backoffice-admin.md](docs/backoffice-admin.md).

La première exécution peut prendre plusieurs minutes, le temps de télécharger les images et de compiler l'API et le frontend. Les données sont conservées dans les volumes Docker lors des arrêts normaux.

## Accès locaux

| Composant | Adresse |
|---|---|
| Frontend admin Flutter Web | [http://roadalert.com/](http://roadalert.com/) |
| API NestJS | [http://roadalert.com/api/v1](http://roadalert.com/api/v1) |
| Swagger | [http://roadalert.com/docs](http://roadalert.com/docs) |
| Adminer, interface de gestion PostgreSQL | [http://adminer.roadalert.com/](http://adminer.roadalert.com/) |
| API de stockage compatible S3 (RustFS) | [http://storage.roadalert.com/](http://storage.roadalert.com/) |
| Console RustFS, gestion des fichiers S3 | [http://console.storage.roadalert.com/](http://console.storage.roadalert.com/) |
| PostgreSQL/PostGIS (client SQL) | `localhost:5433` |

Liens directs localhost, accessibles sans configurer le fichier `hosts` :

| Composant | Adresse localhost |
|---|---|
| Frontend admin Flutter Web | [http://localhost:8080/](http://localhost:8080/) |
| API NestJS | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) |
| Swagger | [http://localhost:8080/docs](http://localhost:8080/docs) |
| Adminer | [http://localhost:8888/](http://localhost:8888/) |
| API de stockage RustFS | [http://localhost:9002/](http://localhost:9002/) |
| Console RustFS | [http://localhost:9003/](http://localhost:9003/) |
| PostgreSQL/PostGIS | `localhost:5433` |

### Connexion Adminer

Dans Adminer, saisir ces paramètres pour ouvrir la base PostgreSQL locale :

| Champ Adminer | Valeur de développement |
|---|---|
| Système | PostgreSQL |
| Serveur | `db` |
| Utilisateur | `roadalert` |
| Mot de passe | `roadalert_dev` |
| Base de données | `roadalert` |

Ces valeurs viennent de `.env.dev` (`DB_USER`, `DB_PASSWORD`, `DB_NAME`). Adminer parle à PostgreSQL depuis le réseau Docker : le serveur est donc `db`, pas `localhost`. Le port `5433` ne sert qu'aux clients SQL lancés directement sur Windows.

### Pourquoi la console RustFS ?

RustFS fournit le stockage de fichiers compatible S3 utilisé par l'API, par exemple pour les pièces jointes et les images téléversées. Sa console permet de visualiser et gérer les buckets et les objets stockés; ce n'est pas l'interface de la base PostgreSQL. Pour la connexion locale, utiliser l'identifiant `roadalert` et le secret `roadalert_minio_dev` de `.env.dev` (variables `MINIO_ROOT_USER` et `MINIO_ROOT_PASSWORD`). L'API se connecte au service en interne à `http://minio:9000`; le domaine `storage.roadalert.com` est l'adresse locale lisible exposée par Nginx.

## Noms locaux et production

Pour faire pointer `roadalert.com` vers cette machine, ouvrir le Bloc-notes **en tant qu'administrateur**, puis modifier :

```text
C:\Windows\System32\drivers\etc\hosts
```

Ajouter cette ligne :

```text
127.0.0.1 roadalert.com
127.0.0.1 adminer.roadalert.com
127.0.0.1 storage.roadalert.com
127.0.0.1 console.storage.roadalert.com
```

Enregistrer le fichier. Les noms suivants ne contiennent pas de port :

| Service | Adresse locale sans port |
|---|---|
| Application admin | `http://roadalert.com/` |
| API | `http://roadalert.com/api/v1` |
| Swagger | `http://roadalert.com/docs` |
| Adminer | `http://adminer.roadalert.com/` |
| API de stockage compatible S3 (RustFS) | `http://storage.roadalert.com/` |
| Console RustFS | `http://console.storage.roadalert.com/` |



## Applications mobiles

Compose démarre le frontend admin web, mais pas les applications mobiles: elles nécessitent un émulateur ou un appareil connecté. Après le démarrage de la pile, dans un autre terminal :

```powershell
cd frontend-mobile-citoyen
flutter run --dart-define=API_BASE_URL=http://roadalert.com/api/v1
```

Pour l'application agent, utiliser le dossier `frontend-mobile-agent`. Depuis un émulateur Android, utiliser `http://10.0.2.2/api/v1` comme URL d'API (le port 80 est implicite).

Pour lancer l'admin Flutter directement avec hot reload au lieu de son conteneur :

```powershell
cd frontend-admin-web
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://roadalert.com/api/v1
```

## Arrêt et diagnostic

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev ps
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev logs -f backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev logs -f frontend-admin-web
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev down
```

`down` arrête les conteneurs sans effacer les données. Pour supprimer aussi les volumes et réinitialiser PostgreSQL, Redis et RustFS, ajouter `-v` à `down`.

Pour reconstruire uniquement le frontend ou l'API après une modification (usage optionnel, pas requis au démarrage normal) :

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build -d frontend-admin-web
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build -d backend
```
## Développement backend et production

Pour exécuter NestJS sur l'hôte, garder les dépendances disponibles avec `docker compose up -d db redis`, puis :

```powershell
cd backend
npm install
npm run start:dev
npm run test
npm run test:e2e
```

En production, configurer les URLs HTTPS et les secrets dans le `.env` du serveur, puis démarrer avec :

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Ne jamais réutiliser les secrets de développement en production.

---

## Backlog & sprints

Le backlog est sur GitHub Projects (ROADALERT BOARD).

| Livrable | Format |
|----------|--------|
| Cahier des Charges | `.docx` / `.pdf` |
| Conception Technique Backend | Markdown |
| Backlog | GitHub Projects (Table, Kanban, Roadmap) |
| Applications Mobiles | Flutter (Citoyen / Agent) |
| Web Admin | Flutter Web |
---

## Sécurité

- **Authentification** : JWT + bcrypt
- **RBAC** : Guards NestJS (`citoyen`, `agent`, `admin`)
- **Validation** : `class-validator`
- **CI** : Trivy, Trufflehog

---

## Structure du projet

roadalert/
├── .env.example              # unique modèle d'env (valeurs local uniquement)
├── docker-compose.yml        # socle (sans ports hôte)
├── frontend-mobile-agent/
├── database/
├── docs/
├── nginx/
└── .github/
```
