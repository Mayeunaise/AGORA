-- =========================================================
-- AGORA — serveur/schema.sql
-- Schéma de la base SQLite (agora.db).
-- Les identifiants d'auteur (auteur_id) ne sont pas des clés
-- étrangères : les données de démo citent des participants
-- qui n'ont pas de compte.
-- =========================================================

PRAGMA foreign_keys = ON;

CREATE TABLE utilisateurs (
  id                TEXT PRIMARY KEY,
  prenom            TEXT NOT NULL,
  nom               TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
  mot_de_passe_hash TEXT NOT NULL,
  date_naissance    TEXT,
  genre             TEXT,
  role              TEXT NOT NULL CHECK (role IN ('citoyen', 'moderateur', 'institution')),
  date_inscription  TEXT NOT NULL
);

-- Demande de statut « responsable institutionnel » (0 ou 1 par utilisateur)
CREATE TABLE demandes_institution (
  utilisateur_id TEXT PRIMARY KEY REFERENCES utilisateurs (id) ON DELETE CASCADE,
  organisme      TEXT NOT NULL,
  fonction       TEXT NOT NULL,
  date           TEXT NOT NULL,
  statut         TEXT NOT NULL,
  justification  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE lois (
  id                     TEXT PRIMARY KEY,
  titre                  TEXT NOT NULL,
  theme                  TEXT NOT NULL,
  portee                 TEXT NOT NULL DEFAULT 'locale' CHECK (portee IN ('locale', 'nationale')),
  region                 TEXT NOT NULL DEFAULT '',
  departement            TEXT NOT NULL DEFAULT '',
  description            TEXT NOT NULL,
  description_officielle TEXT NOT NULL DEFAULT '',
  photo                  TEXT NOT NULL DEFAULT '',  -- image en data URL
  statut                 TEXT NOT NULL CHECK (statut IN ('soumise', 'en-discussion', 'examinee', 'cloturee', 'refusee')),
  auteur_id              TEXT NOT NULL,
  auteur_pseudo          TEXT NOT NULL,
  date_creation          TEXT NOT NULL,
  pour                   INTEGER NOT NULL DEFAULT 0 CHECK (pour >= 0),
  contre                 INTEGER NOT NULL DEFAULT 0 CHECK (contre >= 0)
);

-- Réponse publiée par l'institution (0 ou 1 par loi)
CREATE TABLE reponses_officielles (
  loi_id TEXT PRIMARY KEY REFERENCES lois (id) ON DELETE CASCADE,
  texte  TEXT NOT NULL,
  auteur TEXT NOT NULL,
  date   TEXT NOT NULL
);

-- Décision de modération sur une proposition (0 ou 1 par loi)
CREATE TABLE moderations_lois (
  loi_id        TEXT PRIMARY KEY REFERENCES lois (id) ON DELETE CASCADE,
  decision      TEXT NOT NULL,
  justification TEXT NOT NULL,
  date          TEXT NOT NULL,
  moderateur    TEXT NOT NULL
);

-- Messages du débat
CREATE TABLE messages (
  id        TEXT PRIMARY KEY,
  loi_id    TEXT NOT NULL REFERENCES lois (id) ON DELETE CASCADE,
  auteur_id TEXT NOT NULL,
  auteur    TEXT NOT NULL,
  date      TEXT NOT NULL,
  texte     TEXT NOT NULL
);
CREATE INDEX idx_messages_loi ON messages (loi_id, date);

CREATE TABLE signalements (
  message_id TEXT PRIMARY KEY REFERENCES messages (id) ON DELETE CASCADE,
  motif      TEXT NOT NULL,
  date       TEXT NOT NULL,
  par        TEXT NOT NULL
);

CREATE TABLE moderations_messages (
  message_id    TEXT PRIMARY KEY REFERENCES messages (id) ON DELETE CASCADE,
  decision      TEXT NOT NULL,
  justification TEXT NOT NULL,
  date          TEXT NOT NULL,
  moderateur    TEXT NOT NULL
);

-- Un seul avis par compte et par loi
CREATE TABLE avis (
  utilisateur_id TEXT NOT NULL,
  loi_id         TEXT NOT NULL REFERENCES lois (id) ON DELETE CASCADE,
  valeur         TEXT NOT NULL CHECK (valeur IN ('pour', 'contre')),
  PRIMARY KEY (utilisateur_id, loi_id)
);

-- Journal public de modération
CREATE TABLE journal (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL,
  type          TEXT NOT NULL,
  cible         TEXT NOT NULL,
  decision      TEXT NOT NULL,
  justification TEXT NOT NULL DEFAULT ''
);
