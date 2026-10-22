"""
AGORA — serveur/app.py
API JSON qui enregistre les données du site dans une base SQLite (agora.db).
Le site, hébergé sur GitHub Pages, l'appelle à l'adresse indiquée dans
Site/js/api-config.js.

Prototype pédagogique : l'API n'exige pas d'être connecté pour écrire.
Seuls les mots de passe sont protégés (hachés, jamais renvoyés).
"""
import json
import sqlite3
from pathlib import Path

from flask import Flask, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

DOSSIER = Path(__file__).resolve().parent
FICHIER_BASE = DOSSIER / 'agora.db'
SCHEMA = DOSSIER / 'schema.sql'
DONNEES_DEMO = DOSSIER.parent / 'Site' / 'data'

LIBELLES_DECISION = {'acceptee': 'Acceptée', 'modifiee': 'Modifiée puis acceptée', 'refusee': 'Refusée'}

app = Flask(__name__)
app.json.ensure_ascii = False
app.json.sort_keys = False


# ---------- Connexion à la base ----------

def base():
    if 'db' not in g:
        g.db = sqlite3.connect(FICHIER_BASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA foreign_keys = ON')
    return g.db


@app.teardown_appcontext
def fermer_base(_erreur):
    db = g.pop('db', None)
    if db is not None:
        db.close()


@app.after_request
def autoriser_site(reponse):
    # Le site est servi par GitHub Pages, sur une autre adresse que l'API
    reponse.headers['Access-Control-Allow-Origin'] = '*'
    reponse.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    reponse.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
    return reponse


# ---------- Écriture : objets JSON du site -> tables ----------

def enregistrer_utilisateur(db, u):
    """Crée ou met à jour un compte. Le mot de passe n'est changé que s'il est fourni."""
    existe = db.execute('SELECT 1 FROM utilisateurs WHERE id = ?', (u['id'],)).fetchone()
    valeurs = (u['prenom'], u['nom'], u['email'], u.get('dateNaissance'), u.get('genre'),
               u['role'], u['dateInscription'])
    if existe:
        db.execute('''UPDATE utilisateurs SET prenom = ?, nom = ?, email = ?, date_naissance = ?,
                      genre = ?, role = ?, date_inscription = ? WHERE id = ?''', (*valeurs, u['id']))
        if u.get('motDePasse'):
            db.execute('UPDATE utilisateurs SET mot_de_passe_hash = ? WHERE id = ?',
                       (generate_password_hash(u['motDePasse']), u['id']))
    else:
        db.execute('''INSERT INTO utilisateurs (prenom, nom, email, date_naissance, genre, role,
                      date_inscription, id, mot_de_passe_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                   (*valeurs, u['id'], generate_password_hash(u['motDePasse'])))

    d = u.get('demandeInstitution')
    if d:
        db.execute('''INSERT INTO demandes_institution (utilisateur_id, organisme, fonction, date, statut, justification)
                      VALUES (?, ?, ?, ?, ?, ?)
                      ON CONFLICT (utilisateur_id) DO UPDATE SET organisme = excluded.organisme,
                        fonction = excluded.fonction, date = excluded.date, statut = excluded.statut,
                        justification = excluded.justification''',
                   (u['id'], d['organisme'], d['fonction'], d['date'], d['statut'], d.get('justification', '')))
    else:
        db.execute('DELETE FROM demandes_institution WHERE utilisateur_id = ?', (u['id'],))


def enregistrer_loi(db, loi, compteurs_initiaux=False):
    """
    Crée ou met à jour une loi.
    - Les compteurs d'avis ne sont écrits qu'à la création (ensuite : route /api/avis).
    - Les messages, signalements et décisions sont ajoutés ou mis à jour, jamais
      supprimés : une version périmée de la page ne peut pas effacer le message d'un autre.
    """
    pour, contre = (loi.get('pour', 0), loi.get('contre', 0)) if compteurs_initiaux else (0, 0)
    db.execute('''INSERT INTO lois (id, titre, portee, region, departement, description,
                    description_officielle, photo, statut, auteur_id, auteur_pseudo, date_creation, pour, contre,
                    date_adoption)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT (id) DO UPDATE SET titre = excluded.titre,
                    date_adoption = excluded.date_adoption, portee = excluded.portee, region = excluded.region, departement = excluded.departement,
                    description = excluded.description, description_officielle = excluded.description_officielle,
                    photo = excluded.photo, statut = excluded.statut''',
               (loi['id'], loi['titre'], loi.get('portee') or 'locale',
                loi.get('region') or '', loi.get('departement') or '', loi['description'],
                loi.get('descriptionOfficielle') or '', loi.get('photo') or '', loi['statut'],
                loi['auteurId'], loi['auteurPseudo'], loi['dateCreation'], pour, contre,
                loi.get('dateAdoption')))

    themes = loi.get('themes') or ([loi['theme']] if loi.get('theme') else [])
    db.execute('DELETE FROM lois_themes WHERE loi_id = ?', (loi['id'],))
    db.executemany('INSERT INTO lois_themes (loi_id, theme, rang) VALUES (?, ?, ?)',
                   [(loi['id'], t, rang) for rang, t in enumerate(themes)])

    r = loi.get('reponseOfficielle')
    if r:
        db.execute('''INSERT INTO reponses_officielles (loi_id, texte, auteur, date) VALUES (?, ?, ?, ?)
                      ON CONFLICT (loi_id) DO UPDATE SET texte = excluded.texte, auteur = excluded.auteur,
                        date = excluded.date''', (loi['id'], r['texte'], r['auteur'], r['date']))
    else:
        db.execute('DELETE FROM reponses_officielles WHERE loi_id = ?', (loi['id'],))

    m = loi.get('moderation')
    if m:
        db.execute('''INSERT INTO moderations_lois (loi_id, decision, justification, date, moderateur)
                      VALUES (?, ?, ?, ?, ?)
                      ON CONFLICT (loi_id) DO UPDATE SET decision = excluded.decision,
                        justification = excluded.justification, date = excluded.date,
                        moderateur = excluded.moderateur''',
                   (loi['id'], m['decision'], m['justification'], m['date'], m['moderateur']))

    for msg in loi.get('messages', []):
        db.execute('''INSERT INTO messages (id, loi_id, auteur_id, auteur, date, texte) VALUES (?, ?, ?, ?, ?, ?)
                      ON CONFLICT (id) DO UPDATE SET texte = excluded.texte''',
                   (msg['id'], loi['id'], msg['auteurId'], msg['auteur'], msg['date'], msg['texte']))
        s = msg.get('signalement')
        if s:
            db.execute('INSERT OR IGNORE INTO signalements (message_id, motif, date, par) VALUES (?, ?, ?, ?)',
                       (msg['id'], s['motif'], s['date'], s['par']))
        mm = msg.get('moderation')
        if mm:
            db.execute('''INSERT INTO moderations_messages (message_id, decision, justification, date, moderateur)
                          VALUES (?, ?, ?, ?, ?)
                          ON CONFLICT (message_id) DO UPDATE SET decision = excluded.decision,
                            justification = excluded.justification, date = excluded.date,
                            moderateur = excluded.moderateur''',
                       (msg['id'], mm['decision'], mm['justification'], mm['date'], mm['moderateur']))


# ---------- Lecture : tables -> objets JSON du site ----------

def utilisateur_json(row, demande):
    return {
        'id': row['id'], 'prenom': row['prenom'], 'nom': row['nom'], 'email': row['email'],
        'dateNaissance': row['date_naissance'], 'genre': row['genre'], 'role': row['role'],
        'dateInscription': row['date_inscription'],
        'demandeInstitution': {
            'organisme': demande['organisme'], 'fonction': demande['fonction'], 'date': demande['date'],
            'statut': demande['statut'], 'justification': demande['justification']
        } if demande else None
    }


def lire_utilisateurs(db):
    demandes = {d['utilisateur_id']: d for d in db.execute('SELECT * FROM demandes_institution')}
    return [utilisateur_json(u, demandes.get(u['id']))
            for u in db.execute('SELECT * FROM utilisateurs ORDER BY date_inscription')]


def lire_lois(db, loi_id=None):
    filtre, params = ('WHERE id = ?', (loi_id,)) if loi_id else ('', ())
    lois = db.execute(f'SELECT * FROM lois {filtre} ORDER BY date_creation', params).fetchall()
    reponses = {r['loi_id']: r for r in db.execute('SELECT * FROM reponses_officielles')}
    moderations = {m['loi_id']: m for m in db.execute('SELECT * FROM moderations_lois')}
    themes = {}
    for t in db.execute('SELECT loi_id, theme FROM lois_themes ORDER BY loi_id, rang'):
        themes.setdefault(t['loi_id'], []).append(t['theme'])

    messages = {}
    for m in db.execute('''SELECT m.*, s.motif, s.date AS s_date, s.par,
                             mm.decision, mm.justification, mm.date AS mm_date, mm.moderateur
                           FROM messages m
                           LEFT JOIN signalements s ON s.message_id = m.id
                           LEFT JOIN moderations_messages mm ON mm.message_id = m.id
                           ORDER BY m.date'''):
        messages.setdefault(m['loi_id'], []).append({
            'id': m['id'], 'auteurId': m['auteur_id'], 'auteur': m['auteur'], 'date': m['date'], 'texte': m['texte'],
            'signalement': {'motif': m['motif'], 'date': m['s_date'], 'par': m['par']} if m['motif'] else None,
            'moderation': {'decision': m['decision'], 'justification': m['justification'],
                           'date': m['mm_date'], 'moderateur': m['moderateur']} if m['decision'] else None
        })

    resultat = []
    for l in lois:
        r, mod = reponses.get(l['id']), moderations.get(l['id'])
        resultat.append({
            'id': l['id'], 'titre': l['titre'], 'themes': themes.get(l['id'], []), 'portee': l['portee'],
            'region': l['region'], 'departement': l['departement'], 'description': l['description'],
            'descriptionOfficielle': l['description_officielle'], 'photo': l['photo'], 'statut': l['statut'],
            'auteurId': l['auteur_id'], 'auteurPseudo': l['auteur_pseudo'], 'dateCreation': l['date_creation'],
            'pour': l['pour'], 'contre': l['contre'], 'dateAdoption': l['date_adoption'],
            'reponseOfficielle': {'texte': r['texte'], 'auteur': r['auteur'], 'date': r['date']} if r else None,
            'moderation': {'decision': mod['decision'], 'justification': mod['justification'],
                           'date': mod['date'], 'moderateur': mod['moderateur']} if mod else None,
            'messages': messages.get(l['id'], [])
        })
    return resultat


def lire_avis(db):
    avis = {}
    for a in db.execute('SELECT * FROM avis'):
        avis.setdefault(a['utilisateur_id'], {})[a['loi_id']] = a['valeur']
    return avis


def lire_journal(db):
    return [{'date': j['date'], 'type': j['type'], 'cible': j['cible'],
             'decision': j['decision'], 'justification': j['justification']}
            for j in db.execute('SELECT * FROM journal ORDER BY date DESC, id DESC')]


# ---------- Routes ----------

@app.get('/')
@app.get('/api')
def accueil():
    return jsonify({'service': 'API AGORA', 'ok': True})


@app.get('/api/donnees')
def toutes_les_donnees():
    db = base()
    return jsonify({'lois': lire_lois(db), 'utilisateurs': lire_utilisateurs(db),
                    'avis': lire_avis(db), 'journal': lire_journal(db)})


@app.put('/api/lois/<loi_id>')
def sauver_loi(loi_id):
    loi = request.get_json()
    loi['id'] = loi_id
    db = base()
    with db:
        enregistrer_loi(db, loi)
    return jsonify(lire_lois(db, loi_id)[0])


@app.put('/api/utilisateurs/<utilisateur_id>')
def sauver_utilisateur(utilisateur_id):
    u = request.get_json()
    u['id'] = utilisateur_id
    db = base()
    try:
        with db:
            enregistrer_utilisateur(db, u)
    except sqlite3.IntegrityError:
        return jsonify({'erreur': 'Adresse mail déjà utilisée.'}), 409
    return jsonify({'ok': True})


@app.post('/api/connexion')
def connexion():
    d = request.get_json()
    db = base()
    row = db.execute('SELECT * FROM utilisateurs WHERE email = ?', (d.get('email', '').strip(),)).fetchone()
    if not row or not check_password_hash(row['mot_de_passe_hash'], d.get('motDePasse', '')):
        return jsonify({'erreur': 'Adresse mail ou mot de passe incorrect.'}), 401
    demande = db.execute('SELECT * FROM demandes_institution WHERE utilisateur_id = ?', (row['id'],)).fetchone()
    return jsonify(utilisateur_json(row, demande))


@app.post('/api/avis')
def donner_avis():
    """Enregistre l'avis final d'un compte sur une loi ('pour', 'contre' ou null) et met les compteurs à jour."""
    d = request.get_json()
    valeur = d.get('valeur')
    if valeur not in ('pour', 'contre', None):
        return jsonify({'erreur': 'Avis invalide.'}), 400
    db = base()
    with db:
        precedent = db.execute('SELECT valeur FROM avis WHERE utilisateur_id = ? AND loi_id = ?',
                               (d['utilisateurId'], d['loiId'])).fetchone()
        if precedent:
            # Noms de colonnes sûrs : limités par la contrainte CHECK de la table avis
            colonne = precedent['valeur']
            db.execute(f'UPDATE lois SET {colonne} = MAX(0, {colonne} - 1) WHERE id = ?', (d['loiId'],))
            db.execute('DELETE FROM avis WHERE utilisateur_id = ? AND loi_id = ?', (d['utilisateurId'], d['loiId']))
        if valeur:
            db.execute(f'UPDATE lois SET {valeur} = {valeur} + 1 WHERE id = ?', (d['loiId'],))
            db.execute('INSERT INTO avis (utilisateur_id, loi_id, valeur) VALUES (?, ?, ?)',
                       (d['utilisateurId'], d['loiId'], valeur))
    compteurs = db.execute('SELECT pour, contre FROM lois WHERE id = ?', (d['loiId'],)).fetchone()
    return jsonify(dict(compteurs) if compteurs else {})


@app.post('/api/journal')
def ajouter_journal():
    e = request.get_json()
    db = base()
    with db:
        db.execute('INSERT INTO journal (date, type, cible, decision, justification) VALUES (?, ?, ?, ?, ?)',
                   (e['date'], e['type'], e['cible'], e['decision'], e.get('justification', '')))
    return jsonify({'ok': True}), 201


# ---------- Création de la base au premier lancement ----------

def initialiser_base():
    """Crée les tables et les remplit avec les données fictives de Site/data si la base n'existe pas."""
    if FICHIER_BASE.exists():
        return
    lois = json.loads((DONNEES_DEMO / 'lois.json').read_text(encoding='utf-8'))
    utilisateurs = json.loads((DONNEES_DEMO / 'users.json').read_text(encoding='utf-8'))
    db = sqlite3.connect(FICHIER_BASE)
    try:
        db.executescript(SCHEMA.read_text(encoding='utf-8'))
        with db:
            for u in utilisateurs:
                enregistrer_utilisateur(db, u)
            for loi in lois:
                enregistrer_loi(db, loi, compteurs_initiaux=True)
                m = loi.get('moderation')
                if m and m['decision'] != 'acceptee':
                    db.execute('INSERT INTO journal (date, type, cible, decision, justification) VALUES (?, ?, ?, ?, ?)',
                               (m['date'], 'Proposition', loi['titre'],
                                LIBELLES_DECISION.get(m['decision'], m['decision']), m['justification']))
    except Exception:
        db.close()
        FICHIER_BASE.unlink(missing_ok=True)
        raise
    db.close()


initialiser_base()

if __name__ == '__main__':
    app.run(port=5050, debug=True)
