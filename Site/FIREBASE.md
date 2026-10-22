# Activer la base de données partagée (Firebase)

Sans configuration, chaque navigateur garde ses propres données : une loi créée sur un PC n'apparaît pas sur un autre.
Avec Firebase Firestore, toutes les lois, avis, messages, comptes et décisions de modération sont enregistrés en ligne et visibles par tous les visiteurs du site GitHub Pages.

## 1. Créer le projet (une seule personne de l'équipe)

1. Aller sur https://console.firebase.google.com et se connecter avec un compte Google.
2. **Créer un projet** (par exemple `agora`). Google Analytics n'est pas nécessaire.
3. Dans le menu de gauche : **Créer > Firestore Database > Créer une base de données**.
   - Emplacement : `eur3 (europe-west)`.
   - Démarrer en **mode test**.
4. Onglet **Règles** de Firestore : remplacer le contenu par celui du fichier [`firestore.rules`](firestore.rules), puis **Publier**.
   (Le mode test seul expire au bout de 30 jours.)

## 2. Récupérer la configuration

1. Roue dentée à côté de « Vue d'ensemble du projet » > **Paramètres du projet**.
2. En bas, section **Vos applications** : cliquer sur l'icône **Web** (`</>`), donner un nom (`agora-web`), sans Firebase Hosting.
3. Firebase affiche un objet `firebaseConfig = { apiKey: ..., projectId: ..., ... }`. Le copier.

## 3. Brancher le site

Dans [`js/firebase-config.js`](js/firebase-config.js), remplacer `window.AGORA_FIREBASE = null;` par :

```js
window.AGORA_FIREBASE = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...'
};
```

Commiter et pousser sur GitHub. Au premier chargement du site, la base est remplie automatiquement avec les données fictives de `data/lois.json` et `data/users.json`.

## Bon à savoir

- **Ces clés ne sont pas secrètes** : la configuration web de Firebase est faite pour être publique. Ce qui protège la base, ce sont les règles Firestore.
- **Les règles fournies laissent tout le monde lire et écrire.** C'est acceptable pour une démo avec des données fictives, pas pour de vraies données : les mots de passe des comptes sont stockés en clair (connexion simulée).
- **Repartir de zéro** : dans la console Firestore, supprimer les collections `lois`, `users`, `avis`, `journal` et `meta`. Au prochain chargement, les données fictives sont recréées.
- Le bouton « Réinitialiser » de « Mon compte » ne touche plus à la base partagée : il déconnecte seulement ce navigateur.
- L'accueil se met à jour tout seul quand quelqu'un publie une loi ou donne un avis. Les autres pages se mettent à jour au rechargement.
- Offre gratuite : 50 000 lectures et 20 000 écritures par jour, largement assez pour un projet de cours.
