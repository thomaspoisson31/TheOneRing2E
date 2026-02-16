# Instructions de Déploiement sur Render.com

Ce projet a été configuré pour être facilement déployable sur [Render.com](https://render.com) en tant que site statique.

## Prérequis

1. Avoir un compte sur Render.com.
2. Avoir le code de ce projet sur un dépôt Git (GitHub, GitLab, ou Bitbucket).

## Méthode 1 : Déploiement Automatique (Recommandée)

Le fichier `render.yaml` inclus à la racine du projet permet de configurer automatiquement le service.

1. Dans le tableau de bord Render, cliquez sur **New +** et sélectionnez **Blueprint**.
2. Connectez votre compte Git et sélectionnez le dépôt de ce projet.
3. Render détectera automatiquement le fichier `render.yaml`.
4. Cliquez sur **Apply** pour lancer le déploiement.

## Méthode 2 : Déploiement Manuel (Static Site)

Si vous préférez configurer manuellement :

1. Dans le tableau de bord Render, cliquez sur **New +** et sélectionnez **Static Site**.
2. Connectez votre compte Git et sélectionnez le dépôt.
3. Remplissez les champs suivants :
   - **Name** : Le nom de votre projet (ex: `tor2e-viewer`).
   - **Branch** : `main` (ou la branche que vous utilisez).
   - **Root Directory** : Laisser vide (racine).
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `dist`
4. Cliquez sur **Create Static Site**.

## Vérification

Une fois le déploiement terminé, Render vous fournira une URL (ex: `https://tor2e-viewer.onrender.com`).
Vous pouvez vérifier que :
- La page d'accueil s'affiche correctement.
- Les images et les sons se chargent.
- Les données XML (Adversaires, PNJ) sont bien accessibles.
