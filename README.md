# 🏛️ Projet AGORA — Plateforme de Consultation & Débat Citoyen

> Prototype fonctionnel d'espace civique interactif facilitant la proposition de lois, la délibération citoyenne et le retour institutionnel direct.

---

## 🎯 Contexte & Problématique

### Le Constat
Les citoyens éprouvent souvent le sentiment que leur voix n'a pas d'impact concret : ils ne savent ni comment proposer une loi ou une idée, ni si leurs avis sont réellement pris en compte par les décideurs publics.

### Proposition de Valeur
**AGORA** crée un pont transparent entre citoyens et institutions :
1. Les citoyens débattent et votent sur des propositions d'intérêt public.
2. Les modérateurs assurent des échanges constructifs et impartiaux.
3. Les responsables institutionnels examinent les propositions clés et s'engagent en publiant des **réponses officielles**, bouclant ainsi la boucle de participation.

*Note de cadrage : Vote simulé et consultatif à visée pédagogique. Hors périmètre : authentification forte par identité numérique régalienne, API backend distante et scrutin légal contraignant.*

---

## 👥 Personas & Rôles

| Rôle | Profil / Persona | Objectifs | Contraintes & Enjeux |
| :--- | :--- | :--- | :--- |
| **Citoyen** | *Ex. Thomas, 35 ans*<br>Mobile-first, méfiant vis-à-vis des promesses politiques. | Proposer des projets de loi, débattre, voter pour/contre. | Craint la fuite de données privées et le manque d'écoute. Veut un usage fluide et direct. |
| **Modérateur** | *Équipe de modération*<br>Utilisation Web / Desktop, volume de signalements important. | Maintenir un espace respectueux, catégoriser, traiter les signalements. | Doit rester impartial (ne pas censurer selon ses opinions), motiver chaque décision d'action. |
| **Responsable Institutionnel** | *Claire, 48 ans*<br>Chargée de mission en ministère fictif, peu de temps. | Repérer les propositions à fort impact (> 500 votes) et apporter une réponse officielle argumentée. | Compétences informatiques standards, besoin de synthèses claires et fiables (détection d'anomalies de vote). |

---

## 🧭 Parcours Utilisateurs Clés

1. **Parcours Citoyen :** Découverte de la plateforme $\rightarrow$ Dépôt d'une proposition avec impact $\rightarrow$ Consultation et vote sur d'autres propositions $\rightarrow$ Suivi de ses contributions.
2. **Parcours Modérateur :** Notification de signalement $\rightarrow$ Analyse du contenu contesté $\rightarrow$ Décision d'action (validation, masquage, demande d'édition) avec motif public obligatoire.
3. **Parcours Institutionnel :** Accès au tableau de bord $\rightarrow$ Filtrage par seuil de votes $\rightarrow$ Fiche d'examen et analyse des arguments $\rightarrow$ Publication de la réponse officielle publique.

---

## 🖥️ Architecture des Vues & Fonctionnalités

Le prototype est conçu autour de 8 à 9 vues clés interconnectées :

1. **Accueil / Explorer :** Recherche, tri par popularité/date et filtres thématiques.
2. **Fiche Proposition :** Contexte, arguments pour/contre, votes, bouton de signalement et réponse institutionnelle.
3. **Dépôt d'une proposition :** Formulaire par étapes (titre, contexte, description, impact) avec aperçu avant publication.
4. **Mes Contributions :** Tableau de bord personnel du citoyen permettant de suivre l'avancée et les retours officiels.
5. **File de Modération :** File d'attente priorisée par motif et gravité des signalements.
6. **Détail Signalement :** Interface de décision du modérateur avec saisie obligatoire d'une justification.
7. **Tableau de Bord Institutionnel :** Statistiques globales, métriques d'adhésion, indicateurs de volume et filtres.
8. **Fiche d'Examen & Clôture :** Synthèse équilibrée des arguments, indicateurs d'anomalies de vote et saisie de la décision officielle.
9. **Règles & Transparence (ou Modale / Footer) :** Charte éthique, explications du calcul des votes et limites du service.

*Un sélecteur de rôle en en-tête permet de basculer instantanément entre Citoyen, Modérateur et Institutionnel lors de la démonstration.*

---

## ⚖️ Éthique, Confiance & Protection des Données

* **Avertissement Permanent :** Affichage d'un bandeau rappelant le caractère consultatif et non contraignant de la consultation.
* **Représentativité :** Mention explicite du volume brut de votants à côté des pourcentages (*"résultats non représentatifs de l'ensemble de la population"*).
* **Protection de l'Opinion :** Vote secret, pseudonymat par défaut et agrégation des données (aucun vote individuel n'est accessible côté institutionnel).
* **Anti-Manipulation :** Règles d'un vote unique par profil local et indicateurs d'activité suspecte (ex. pics anormaux de votes récents).
* **Transparence Décisionnelle :** Motifs de modération consultables et obligation d'une réponse officielle pour clôturer une proposition.

---

## 🛠️ Choix Techniques

* **Langages :** HTML5, CSS3 vanilla (responsive & accessible), JavaScript moderne (ES6+).
* **Persistance & Données :** `localStorage` (stockage local client) et fichier initial `propositions.json`.
* **Hébergement :** GitHub Pages (URL accessible directement, autonome et sans dépendances serveur).

---

## 📅 Organisation & Planning (5 Séances)

### Répartition de l'Équipe
* **Membre A (UX & Doc) :** Cadrage, personas, parcours, protocole de tests utilisateurs, support de présentation.
* **Membre B (Front Citoyen) :** Vues Explorer, Dépôt, Fiche proposition, Vote et suivi.
* **Membre C (Front Modération / Institution & Technique) :** Espaces Modérateur et Institutionnel, schémas de données JSON, accessibilité (a11y) et responsive design.

### Calendrier
* **Avant S2 :** Initialisation du dépôt Git, structure de base et mini-entretiens citoyens.
* **S2 (Cadrage & UX) :** Validation de la note de cadrage, formalisation des 3 personas et wireframes.
* **S3 (Prototype V1) :** Intégration HTML/CSS/JS, injection du jeu de données JSON et liaison des parcours de bout en bout.
* **S4 (Tests Utilisateurs & Accessibilité) :** Tests sur 3 à 5 profils extérieurs, application de 2 corrections clés, audit accessibilité (clavier, contrastes, balises).
* **S5 (Soutenance - 20 min) :** Présentation du problème (3 min), démonstration scénarisée (7 min), retour sur les tests (3 min), limites & éthique (2 min), échanges Q/R (5 min).

---

