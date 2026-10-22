# Serveur AGORA (Python + SQLite)

Sans serveur, chaque navigateur garde ses propres données : une loi créée sur un PC n'apparaît pas sur un autre.
Ce serveur enregistre les lois, avis, messages, comptes et décisions de modération dans une base SQLite (`agora.db`), partagée par tous les visiteurs.

```
GitHub Pages (Site/)  ──fetch JSON──▶  serveur Flask (app.py)  ──SQL──▶  agora.db (SQLite)
```

- `schema.sql` : les tables (utilisateurs, lois, messages, avis, journal…).
- `app.py` : l'API. Au premier lancement, elle crée `agora.db` et la remplit avec les données fictives de `Site/data/`.
- Les mots de passe sont hachés (`werkzeug.security`) et ne sont jamais renvoyés par l'API.

## Lancer le serveur sur son PC

```bash
cd serveur
pip install -r requirements.txt
python app.py
```

L'API répond sur http://127.0.0.1:5050. Dans `Site/js/api-config.js`, mettre :

```js
window.AGORA_API = 'http://127.0.0.1:5050';
```

puis ouvrir le site avec Live Server. Ne pas pousser cette adresse sur GitHub : elle ne marche que sur ton PC.

## Mettre le serveur en ligne (PythonAnywhere, gratuit)

PythonAnywhere garde le fichier `agora.db` d'un redémarrage à l'autre, ce qui convient à SQLite.

1. Créer un compte sur https://www.pythonanywhere.com (offre *Beginner*, gratuite).
2. Onglet **Consoles > Bash**, puis :
   ```bash
   git clone https://github.com/Mayeunaise/AGORA.git
   pip install --user flask
   ```
3. Onglet **Web > Add a new web app** > *Manual configuration* > Python 3.x.
4. Dans la page de la web app, ouvrir le fichier **WSGI configuration** et remplacer tout son contenu par :
   ```python
   import sys
   sys.path.insert(0, '/home/VOTRE_PSEUDO/AGORA/serveur')
   from app import app as application
   ```
5. Cliquer sur **Reload**. L'adresse `https://VOTRE_PSEUDO.pythonanywhere.com/api` doit afficher `{"ok": true, ...}`.
6. Dans `Site/js/api-config.js` :
   ```js
   window.AGORA_API = 'https://VOTRE_PSEUDO.pythonanywhere.com';
   ```
   Commiter et pousser sur GitHub.

Pour mettre à jour le serveur après une modification de `app.py` : `cd AGORA && git pull` dans la console Bash, puis **Reload**.

## Consulter la base

```bash
sqlite3 agora.db
sqlite> SELECT titre, statut, pour, contre FROM lois ORDER BY pour DESC;
sqlite> SELECT l.titre, COUNT(m.id) AS nb_messages FROM lois l LEFT JOIN messages m ON m.loi_id = l.id GROUP BY l.id;
```

Ou ouvrir `agora.db` avec [DB Browser for SQLite](https://sqlitebrowser.org).

**Repartir de zéro** : arrêter le serveur, supprimer `agora.db`, relancer. Les données fictives sont recréées.

## Limites (prototype)

- L'API n'exige pas d'être connecté pour écrire : n'importe qui connaissant l'adresse peut modifier les données. Ne pas y mettre de vraies données personnelles.
- Le bouton « Réinitialiser » de « Mon compte » ne touche pas à la base : il déconnecte seulement le navigateur.
- Les pages se mettent à jour toutes les 20 secondes (accueil) ou au rechargement.
