# Backoffice ROADALERT

Le backoffice sera développé dans le projet avec Flutter Web et l'API NestJS existante.

## État actuel

Le conteneur `frontend-admin-web` sert bien l'application Flutter Web, mais [`frontend-admin-web/lib/main.dart`](../frontend-admin-web/lib/main.dart) est encore l'écran de démonstration Flutter. Côté serveur, NestJS initialise PostgreSQL et Swagger, mais ne déclare encore aucune entité TypeORM, aucun contrôleur CRUD ni aucune route métier. Le dossier `database/` ne contient pas encore de schéma métier.

Le backoffice ne peut donc pas encore créer des données métier. Les URL de l'API et de Swagger sont accessibles, mais il n'y a pas de ressources CRUD à appeler.

## Architecture cible

```text
Backoffice Flutter Web
        |
        | HTTP JSON /api/v1 (session JWT)
        v
API NestJS: contrôleurs -> DTO/validation -> services -> TypeORM
        |
        +--> PostgreSQL/PostGIS: données structurées
        +--> RustFS: fichiers et pièces jointes via S3
```

Le navigateur ne se connecte jamais directement à PostgreSQL. Les mutations passent par l'API afin d'appliquer les validations, les règles métier, les autorisations et la journalisation. Adminer reste un outil technique de diagnostic; ce n'est pas le formulaire normal de saisie.

## Périmètre proposé pour le MVP

- Connexion administrateur, profil courant et déconnexion; routes d'administration protégées par rôle.
- Tableau de bord avec compteurs provenant d'endpoints statistiques explicites.
- Gestion des catégories, utilisateurs/agents, signalements et travaux après validation de leur schéma et de leurs relations.
- Pour chaque ressource: liste paginée, recherche, détail, création, modification, validation des champs et archivage contrôlé.
- Import CSV: téléversement, aperçu sans écriture, erreurs par ligne, confirmation, puis import transactionnel. Une clé métier et la règle de détection des doublons doivent être définies pour chaque ressource.
- Journal d'audit: acteur, opération, ressource, date et résultat; ne jamais journaliser les mots de passe ou les jetons.

Le MVP n'ajoute pas de bouton d'exécution SQL arbitraire au backoffice. Les opérations SQL restent réservées aux outils d'administration de base et sont distinctes de la saisie métier.

## Contrat API cible

Les routes exactes sont à confirmer avec le modèle de données. Proposition REST sous `/api/v1` :

| Fonction | Route proposée | Accès |
|---|---|---|
| Connexion | `POST /auth/login` | Public, limitation de débit |
| Profil courant | `GET /auth/me` | Utilisateur connecté |
| Liste et recherche | `GET /categories`, `GET /reports`, etc. | Selon rôle |
| Création | `POST /categories`, `POST /reports`, etc. | Admin ou rôle autorisé |
| Lecture | `GET /{resource}/:id` | Selon rôle et périmètre |
| Modification | `PATCH /{resource}/:id` | Admin ou rôle autorisé |
| Archivage | `DELETE /{resource}/:id` ou route d'archivage | Admin; suppression physique évitée par défaut |
| Aperçu d'import | `POST /admin/imports/:resource/preview` | Admin |
| Confirmation d'import | `POST /admin/imports/:resource/commit` | Admin |
| Historique d'audit | `GET /admin/audit-logs` | Admin autorisé |

Les listes devraient accepter une pagination bornée (`page`, `limit`), un terme de recherche et des filtres explicitement supportés. Les DTO NestJS valident et transforment les entrées; les erreurs de validation retournent des champs compréhensibles par les formulaires Flutter. Les écritures en lot sont atomiques ou retournent un rapport précis par ligne selon la politique choisie.

## Modèle de données à définir

Avant de créer les formulaires, valider pour chaque ressource :

- champs, types, valeurs obligatoires et règles d'unicité;
- relations (par exemple un signalement, sa catégorie, son auteur et son statut);
- états et transitions autorisés;
- règles de suppression ou d'archivage;
- rôles pouvant lire et modifier chaque champ;
- champs de provenance requis pour l'import et l'audit.

Créer ensuite les entités TypeORM, contraintes PostgreSQL/PostGIS et migrations versionnées. Les migrations doivent être le mécanisme de référence pour les environnements partagés; ne pas compter sur `synchronize` pour créer ou modifier un schéma en production.

## Ordre de réalisation

1. Valider le dictionnaire de données et les règles des premières ressources avec le propriétaire fonctionnel.
2. Créer migrations, entités, DTO, services et tests API pour une première ressource verticale.
3. Ajouter authentification réelle, guards de rôles et audit avant d'exposer l'écriture.
4. Construire dans Flutter la navigation, la liste, le formulaire de création/édition et les états chargement/erreur/succès de cette ressource.
5. Ajouter les autres ressources puis l'import CSV avec aperçu et tests de doublons/rollback.
6. Tester le parcours complet: formulaire -> API -> validation -> transaction PostgreSQL -> relecture dans la liste.

## Critères d'acceptation

- Toute écriture du backoffice passe par une route versionnée et protégée; un rôle non autorisé reçoit `401` ou `403`.
- Les entrées invalides n'altèrent pas la base et produisent des erreurs de formulaire actionnables.
- Une création réussie réapparaît après rechargement de la liste et est persistée dans PostgreSQL.
- L'import montre les lignes valides, invalides et dupliquées avant confirmation et ne laisse pas d'écriture partielle non signalée.
- Les fichiers sont envoyés à l'API puis stockés dans RustFS; aucun secret S3 n'est exposé au navigateur.