# SIGMA Frontend

Projet React basé sur un template Material UI (MUI) et Vite. Le squelette général (layout, thèmes, composants communs) provient du template, tandis que la logique métier et les écrans spécifiques à SIGMA sont principalement implémentés dans le dossier `src/sigma`.

## Aperçu
- Stack: React 18 + Vite 5 + MUI 5 (Material UI)
- Gestion d'état: Redux Toolkit + Redux Persist (selon les besoins)
- Données côté client: TanStack Query (react-query)
- Routage: React Router v6
- Outils: ESLint + Prettier

## Prérequis
- Node.js 18+ (recommandé)
- Yarn 4+ ou npm 9+

## Installation
1. Installer les dépendances
   - `yarn` ou `npm install`
2. Lancer le serveur de développement
   - `yarn dev` (ou `yarn start`) / `npm run dev`
   - L'appli s'ouvre automatiquement sur http://localhost:3000

## Scripts disponibles
- `yarn dev` / `npm run dev` : démarre le serveur Vite en développement
- `yarn build` / `npm run build` : build de production
- `yarn preview` / `npm run preview` : prévisualisation du build
- `yarn lint` : analyse ESLint
- `yarn lint:fix` : ESLint avec correction
- `yarn prettier` : formatage du code

## Configuration (.env)
Créer un fichier `.env` à la racine si nécessaire. Variables courantes détectées dans le projet :
- `VITE_APP_API_URL` : URL de l'API backend (par défaut http://localhost:8080)
- `VITE_APP_BASE_NAME` : base du router si l'app n'est pas servie à la racine
- `VITE_APP_VERSION` : version affichée dans l'UI
- Firebase : `VITE_APP_FIREBASE_API_KEY`, `VITE_APP_FIREBASE_AUTH_DOMAIN`, `VITE_APP_FIREBASE_PROJECT_ID`, `VITE_APP_FIREBASE_STORAGE_BUCKET`, `VITE_APP_FIREBASE_MESSAGING_SENDER_ID`, `VITE_APP_FIREBASE_APP_ID`, `VITE_APP_FIREBASE_MEASUREMENT_ID`
- Auth0 : `VITE_APP_AUTH0_CLIENT_ID`, `VITE_APP_AUTH0_DOMAIN`
- AWS Cognito : `VITE_APP_AWS_POOL_ID`, `VITE_APP_AWS_APP_CLIENT_ID`
- Mapbox : `VITE_APP_MAPBOX_ACCESS_TOKEN`
- Autres : `PUBLIC_URL` (pour certains services workers/URLs)

Note: le port par défaut du serveur de dev est 3000 (voir `vite.config.mjs`).

## Structure du projet
Voici les dossiers les plus pertinents. La partie personnalisée du projet se trouve dans `src/sigma`.

- `src/`
  - `sigma/` ← logique métier et écrans spécifiques SIGMA
    - `api/` : clients API (axios, endpoints métier)
    - `hooks/` : hooks personnalisés (ex. react-query)
    - `store/` : slices Redux, hooks `useAppDispatch`, `useAppSelector`
    - `views/` : pages/écrans (administration, business, etc.)
    - `components/` : composants UI spécifiques SIGMA
    - `utilities/` : utilitaires (axios, helpers)
  - `routes/` : configuration du routage
  - `layout/` : layout principal issu du template MUI
  - `contexts/` : contexts (Firebase, Auth0, Cognito, etc.)

Aliases utiles (vite.config.mjs) :
- `~` pointe vers `node_modules`
- `src/...` résout vers la racine `src`

## Construction et déploiement
1. Build production
   - `yarn build` ou `npm run build`
2. Prévisualiser le build (optionnel)
   - `yarn preview` ou `npm run preview`
3. Déploiement
   - Servir le dossier `dist` sur votre hébergeur (Nginx, Apache, Netlify, Vercel, etc.)

## Contributions
- Respecter ESLint et Prettier
- Préférer les hooks et composants réutilisables dans `src/sigma`
- Documenter les variables d'environnement spécifiques si de nouvelles sont ajoutées
