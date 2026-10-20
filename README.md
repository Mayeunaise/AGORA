# AGORA — prototype web navigable

Plateforme citoyenne **fictive** : proposer des idées de lois, débattre et donner un avis favorable / défavorable.
L'avis est **consultatif et simulé**, ce n'est jamais un vote officiel.

Projet fil rouge « Design des usages 2027 » — sujet 6.

## Lancer le prototype

> Le site charge ses données avec `fetch()` : il ne fonctionne **pas** en double-cliquant sur `index.html`. Il faut un petit serveur local.

**Option 1 : VS Code + Live Server**
1. Ouvrir le dossier `agora` dans VS Code.
2. Installer l'extension **Live Server** (Ritwick Dey).
3. Clic droit sur `index.html` → **Open with Live Server**.

**Option 2 : Python (déjà installé sur la plupart des machines)**
```bash
cd agora
python -m http.server 8000
```
Puis ouvrir http://localhost:8000

## Comptes de démonstration

Mot de passe pour tous : `demo1234`

| Rôle | Adresse |
| --- | --- |
| Citoyen | citoyen@agora.demo |
| Modérateur | moderateur@agora.demo |
| Responsable institutionnel | institution@agora.demo |

Une fois connecté, le menu **« Mode démo »** du header permet de passer d'un rôle à l'autre.
Le bouton **« Réinitialiser la démonstration »** (page Mon compte) remet les données d'origine.

## Scénario de démonstration (soutenance)

1. **Citoyen** : accueil → filtrer par région → ouvrir une proposition → donner un avis → écrire un message → « Créer une loi » (statut Soumise).
2. **Modérateur** : « Alertes » → accepter la proposition créée, refuser « SUPPRIMER TOUTES LES TAXES… » avec justification, masquer le message injurieux signalé → « Comptes » → accepter la mairie, refuser l'association.
3. **Responsable institutionnel** : ouvrir une proposition → « Modifier » → rédiger la description officielle, publier une réponse, passer en « Clôturée ».
4. Retour **citoyen** : « Mon compte » montre le statut et la réponse ; la page « Règles » affiche le journal public de modération.

## Publier sur GitHub Pages

1. Créer un dépôt GitHub (ex. `agora`) et y envoyer le **contenu** du dossier (`index.html` doit être à la racine du dépôt).
2. Dépôt → **Settings** → **Pages**.
3. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)` → **Save**.
4. Attendre 1 à 2 minutes : le site est disponible à `https://<pseudo>.github.io/agora/`.

## Arborescence

```
index.html             Connexion (authentification simulée)
inscription.html       Création de compte
accueil.html           Liste des propositions, recherche et filtres
loi.html?id=…          Fiche : titre, description, avis, débat
creer-loi.html         Formulaire de proposition
compte.html            Données personnelles, mes propositions, demande institutionnelle
moderation-lois.html   Alertes : propositions soumises et messages signalés
moderation-comptes.html Demandes de comptes institutionnels
regles.html            Règles, transparence et journal public
css/style.css          Styles (variables dans :root)
js/app.js              Commun : données, session, header, utilitaires
js/<page>.js           Un script par page
data/lois.json         12 propositions fictives
data/users.json        Comptes fictifs
```

## Limites connues (à expliquer à l'oral)

- Authentification simulée : mots de passe stockés en clair dans le navigateur.
- Données locales au navigateur : deux ordinateurs ne voient pas les mêmes avis.
- Pas de détection réelle des manipulations (comptes multiples).
- Les photos sont réduites et stockées dans localStorage (quelques Mo maximum au total).

## Outils utilisés

Code généré avec l'aide d'un LLM (Claude) à partir du cahier des charges et du diagramme des parcours du groupe, puis relu et testé par le groupe.
