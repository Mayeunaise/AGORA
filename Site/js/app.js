/* =========================================================
   AGORA — js/app.js
   Fichier commun à toutes les pages :
   - chargement des données fictives (data/*.json) dans localStorage
   - session SIMULÉE (aucune sécurité réelle : prototype pédagogique)
   - rôles, mode modération, header, bandeau, pied de page
   - utilitaires (icônes SVG, dates, validation de formulaires, annonces)
   ========================================================= */
'use strict';

const AGORA = (() => {
  /* ---------- Clés de stockage local ---------- */
  const CLES = {
    version: 'agora_version',
    users: 'agora_users',
    lois: 'agora_lois',
    session: 'agora_session',
    avis: 'agora_avis',
    mode: 'agora_mode',
    journal: 'agora_journal',
    bandeau: 'agora_bandeau_ferme'
  };
  // Changer ce numéro force le rechargement des données JSON
  const VERSION_DONNEES = '1.0';

  /* ---------- Référentiels ---------- */
  const COMPTES_DEMO = { citoyen: 'u1', moderateur: 'u2', institution: 'u3' };

  const ROLES = {
    citoyen: 'Citoyen',
    moderateur: 'Modérateur',
    institution: 'Responsable institutionnel'
  };

  const STATUTS = {
    'soumise': { label: 'Soumise', aide: 'En attente de validation par la modération' },
    'en-discussion': { label: 'En discussion', aide: 'Ouverte aux avis et au débat' },
    'examinee': { label: 'Examinée', aide: 'En cours d’examen par l’institution, le débat reste ouvert' },
    'cloturee': { label: 'Clôturée', aide: 'L’institution a publié sa réponse' },
    'refusee': { label: 'Refusée', aide: 'Non conforme aux règles de la plateforme' }
  };
  // Statuts visibles par tous sur l'accueil
  const STATUTS_PUBLICS = ['en-discussion', 'examinee', 'cloturee'];

  const THEMES = ['Environnement', 'Transport', 'Éducation', 'Santé', 'Numérique', 'Logement',
    'Agriculture', 'Culture', 'Énergie', 'Sécurité routière', 'Autre'];

  const REGIONS = {
    'Auvergne-Rhône-Alpes': ['Ain', 'Isère', 'Loire', 'Haute-Loire', 'Puy-de-Dôme', 'Rhône', 'Savoie'],
    'Bretagne': ['Côtes-d’Armor', 'Finistère', 'Ille-et-Vilaine', 'Morbihan'],
    'Grand Est': ['Bas-Rhin', 'Haut-Rhin', 'Marne', 'Moselle'],
    'Hauts-de-France': ['Aisne', 'Nord', 'Pas-de-Calais', 'Somme'],
    'Île-de-France': ['Essonne', 'Hauts-de-Seine', 'Paris', 'Seine-Saint-Denis', 'Val-de-Marne'],
    'Nouvelle-Aquitaine': ['Gironde', 'Haute-Vienne', 'Pyrénées-Atlantiques', 'Vienne'],
    'Occitanie': ['Gard', 'Haute-Garonne', 'Hérault', 'Pyrénées-Orientales'],
    'Provence-Alpes-Côte d\'Azur': ['Alpes-Maritimes', 'Bouches-du-Rhône', 'Var', 'Vaucluse']
  };

  const MOTIFS_SIGNALEMENT = ['Propos injurieux', 'Hors sujet', 'Fausse information', 'Spam ou publicité', 'Données personnelles'];

  /* ---------- Icônes SVG inline (aucune image externe) ---------- */
  const CHEMINS = {
    agora: '<path d="M3 21h18M5 21V10M9.5 21V10M14.5 21V10M19 21V10M2 10l10-7 10 7z"/>',
    maison: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    bouclier: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    cloche: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    alerte: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    pouceHaut: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
    pouceBas: '<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>',
    bulle: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    drapeau: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    sortie: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    croix: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    crayon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    epingle: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    loupe: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    echange: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    retour: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    cadenas: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    oeil: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    feuille: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/><line x1="7" y1="21" x2="7" y2="18"/><line x1="17" y1="21" x2="17" y2="18"/>',
    livre: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    coeur: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    ecran: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    soleil: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    musique: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    epi: '<path d="M12 22V8"/><path d="M12 8c-3 0-5-2-5-5 3 0 5 2 5 5zM12 8c3 0 5-2 5-5-3 0-5 2-5 5zM12 14c-3 0-5-2-5-5 3 0 5 2 5 5zM12 14c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
    panneau: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    immeuble: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/>',
    poubelle: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>'
  };

  // Icône associée à chaque thème (visuel des cartes sans photo)
  const ICONE_THEME = {
    'Environnement': 'feuille', 'Transport': 'bus', 'Éducation': 'livre', 'Santé': 'coeur',
    'Numérique': 'ecran', 'Logement': 'immeuble', 'Agriculture': 'epi', 'Culture': 'musique',
    'Énergie': 'soleil', 'Sécurité routière': 'panneau', 'Autre': 'agora'
  };

  /** Renvoie le code SVG d'une icône décorative (masquée aux lecteurs d'écran). */
  function icone(nom, classe = '') {
    return `<svg class="icone ${classe}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${CHEMINS[nom] || CHEMINS.agora}</svg>`;
  }

  /* ---------- Stockage local ---------- */
  function lire(cle, defaut = null) {
    try {
      const valeur = localStorage.getItem(cle);
      return valeur === null ? defaut : JSON.parse(valeur);
    } catch (e) {
      return defaut;
    }
  }

  function ecrire(cle, valeur) {
    try {
      localStorage.setItem(cle, JSON.stringify(valeur));
      return true;
    } catch (e) {
      // Le plus souvent : quota dépassé à cause d'une photo trop lourde
      annoncer('Enregistrement impossible : l’espace de stockage du navigateur est plein.', 'erreur');
      return false;
    }
  }

  async function lireJSON(chemin) {
    const reponse = await fetch(chemin);
    if (!reponse.ok) throw new Error(`Impossible de charger ${chemin}`);
    return reponse.json();
  }

  /** Charge les données fictives au premier lancement (ou après réinitialisation). */
  async function chargerDonnees() {
    if (lire(CLES.version) === VERSION_DONNEES && lire(CLES.lois) && lire(CLES.users)) return;
    const [lois, users] = await Promise.all([lireJSON('data/lois.json'), lireJSON('data/users.json')]);
    ecrire(CLES.lois, lois);
    ecrire(CLES.users, users);
    ecrire(CLES.avis, {});
    ecrire(CLES.journal, journalInitial(lois));
    ecrire(CLES.version, VERSION_DONNEES);
    localStorage.removeItem(CLES.session);
  }

  /** Construit le journal public de modération à partir des décisions déjà présentes. */
  function journalInitial(lois) {
    return lois
      .filter(l => l.moderation && l.moderation.decision !== 'acceptee')
      .map(l => ({
        date: l.moderation.date,
        type: 'Proposition',
        cible: l.titre,
        decision: libelleDecision(l.moderation.decision),
        justification: l.moderation.justification
      }));
  }

  /** Efface toutes les données locales et repart des fichiers JSON. */
  function reinitialiser() {
    Object.values(CLES).forEach(cle => localStorage.removeItem(cle));
    location.href = 'index.html';
  }

  /* ---------- Accès aux données ---------- */
  const getLois = () => lire(CLES.lois, []);
  const saveLois = lois => ecrire(CLES.lois, lois);
  const getLoi = id => getLois().find(l => l.id === id) || null;

  function saveLoi(loiModifiee) {
    const lois = getLois();
    const index = lois.findIndex(l => l.id === loiModifiee.id);
    if (index === -1) lois.push(loiModifiee); else lois[index] = loiModifiee;
    return saveLois(lois);
  }

  const getUsers = () => lire(CLES.users, []);
  const saveUsers = users => ecrire(CLES.users, users);
  const getUser = id => getUsers().find(u => u.id === id) || null;

  function saveUser(userModifie) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userModifie.id);
    if (index === -1) users.push(userModifie); else users[index] = userModifie;
    return saveUsers(users);
  }

  /* ---------- Journal public de modération ---------- */
  function libelleDecision(decision) {
    return {
      acceptee: 'Acceptée', modifiee: 'Modifiée puis acceptée', refusee: 'Refusée',
      conserve: 'Message conservé', masque: 'Message masqué'
    }[decision] || decision;
  }

  function ajouterJournal(entree) {
    const journal = lire(CLES.journal, []);
    journal.unshift({ date: new Date().toISOString(), ...entree });
    ecrire(CLES.journal, journal);
  }
  const getJournal = () => lire(CLES.journal, []);

  /* ---------- Session simulée ---------- */
  function utilisateurCourant() {
    const id = lire(CLES.session);
    return id ? getUser(id) : null;
  }

  function connecter(id) {
    ecrire(CLES.session, id);
    const user = getUser(id);
    // Un modérateur arrive par défaut en mode modération
    if (user && user.role === 'moderateur') ecrire(CLES.mode, 'moderation');
  }

  function deconnecter() {
    localStorage.removeItem(CLES.session);
    localStorage.removeItem(CLES.mode);
    location.href = 'index.html';
  }

  /** Authentification simulée : comparaison en clair, aucune sécurité réelle. */
  function authentifier(email, motDePasse) {
    const user = getUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.motDePasse !== motDePasse) return null;
    return user;
  }

  /** Vrai si l'utilisateur est modérateur ET en mode modération. */
  function estModeModeration(user) {
    return !!user && user.role === 'moderateur' && lire(CLES.mode, 'moderation') === 'moderation';
  }

  function basculerMode() {
    const actuel = lire(CLES.mode, 'moderation');
    ecrire(CLES.mode, actuel === 'moderation' ? 'citoyen' : 'moderation');
  }

  /* ---------- Avis consultatifs ---------- */
  function getAvis(userId, loiId) {
    const avis = lire(CLES.avis, {});
    return (avis[userId] && avis[userId][loiId]) || null;
  }

  /**
   * Donne, change ou retire un avis (un seul avis par compte et par loi).
   * Cliquer à nouveau sur le même avis le retire.
   * Renvoie l'avis final : 'pour', 'contre' ou null.
   */
  function donnerAvis(userId, loiId, valeur) {
    const avis = lire(CLES.avis, {});
    const loi = getLoi(loiId);
    if (!loi) return null;
    avis[userId] = avis[userId] || {};
    const precedent = avis[userId][loiId] || null;

    if (precedent) loi[precedent] = Math.max(0, loi[precedent] - 1);
    let final = null;
    if (precedent !== valeur) {
      loi[valeur] += 1;
      final = valeur;
      avis[userId][loiId] = valeur;
    } else {
      delete avis[userId][loiId];
    }
    saveLoi(loi);
    ecrire(CLES.avis, avis);
    return final;
  }

  /* ---------- Compteurs pour les badges du header ---------- */
  function compterAlertes() {
    const lois = getLois();
    const loisEnAttente = lois.filter(l => l.statut === 'soumise').length;
    const messagesSignales = lois.reduce((total, l) =>
      total + l.messages.filter(m => m.signalement && !m.moderation).length, 0);
    return loisEnAttente + messagesSignales;
  }

  function compterDemandesComptes() {
    return getUsers().filter(u => u.demandeInstitution && u.demandeInstitution.statut === 'en attente').length;
  }

  /* ---------- Utilitaires d'affichage ---------- */
  /** Échappe le HTML pour éviter toute injection dans le contenu saisi. */
  function esc(texte) {
    return String(texte ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** Transforme un texte brut en paragraphes HTML échappés. */
  function paragraphes(texte) {
    return String(texte || '')
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  function formatDate(iso, avecHeure = false) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    if (avecHeure) Object.assign(options, { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', options);
  }

  const formatNombre = n => Number(n || 0).toLocaleString('fr-FR');

  /** Nom affiché publiquement : prénom + initiale (protection de l'identité). */
  const pseudo = user => `${user.prenom} ${user.nom.charAt(0).toUpperCase()}.`;

  function badgeStatut(statut) {
    const s = STATUTS[statut] || { label: statut };
    return `<span class="statut statut-${esc(statut)}" title="${esc(s.aide || '')}"><span class="pastille" aria-hidden="true"></span>${esc(s.label)}</span>`;
  }

  function pourcentages(loi) {
    const total = loi.pour + loi.contre;
    const pour = total ? Math.round((loi.pour * 100) / total) : 0;
    return { total, pour, contre: total ? 100 - pour : 0 };
  }

  /** Normalise un texte pour la recherche (minuscules, sans accents). */
  function normaliser(texte) {
    return String(texte || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function genererId(prefixe) {
    return prefixe + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------- Annonces (toast + lecteur d'écran) ---------- */
  let minuteurAnnonce = null;
  function annoncer(message) {
    const zone = document.getElementById('annonce');
    if (!zone) return;
    zone.textContent = message;
    zone.classList.add('visible');
    clearTimeout(minuteurAnnonce);
    minuteurAnnonce = setTimeout(() => zone.classList.remove('visible'), 4500);
  }

  /* ---------- Validation de formulaire accessible ---------- */
  function afficherErreur(champ, message) {
    const idErreur = `${champ.id}-erreur`;
    let bloc = document.getElementById(idErreur);
    if (!bloc) {
      bloc = document.createElement('p');
      bloc.id = idErreur;
      bloc.className = 'erreur';
      (champ.closest('.champ') || champ.parentElement).appendChild(bloc);
    }
    bloc.innerHTML = `${icone('alerte')}<span>${esc(message)}</span>`;
    champ.setAttribute('aria-invalid', 'true');
    const decrit = (champ.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (!decrit.includes(idErreur)) decrit.push(idErreur);
    champ.setAttribute('aria-describedby', decrit.join(' '));
  }

  function effacerErreur(champ) {
    const idErreur = `${champ.id}-erreur`;
    const bloc = document.getElementById(idErreur);
    if (bloc) bloc.remove();
    champ.removeAttribute('aria-invalid');
    const decrit = (champ.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== idErreur);
    if (decrit.length) champ.setAttribute('aria-describedby', decrit.join(' '));
    else champ.removeAttribute('aria-describedby');
  }

  /** Applique une liste de règles {champ, test, message}. Renvoie true si tout est valide. */
  function valider(regles) {
    let valide = true;
    const dejaEnErreur = new Set();
    regles.forEach(({ champ, test, message }) => {
      if (!champ || dejaEnErreur.has(champ)) return;
      effacerErreur(champ);
      if (!test(champ.value.trim())) {
        afficherErreur(champ, message);
        dejaEnErreur.add(champ);
        valide = false;
      }
    });
    // Le focus va sur le premier champ en erreur
    const premier = regles.map(r => r.champ).find(c => c && c.getAttribute('aria-invalid') === 'true');
    if (premier) premier.focus();
    return valide;
  }

  const estEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function age(dateIso) {
    const naissance = new Date(dateIso);
    if (Number.isNaN(naissance.getTime())) return -1;
    const aujourdHui = new Date();
    let a = aujourdHui.getFullYear() - naissance.getFullYear();
    const m = aujourdHui.getMonth() - naissance.getMonth();
    if (m < 0 || (m === 0 && aujourdHui.getDate() < naissance.getDate())) a--;
    return a;
  }

  /** Lieu affiché d'une loi : « France entière » si elle est nationale. */
  function lieu(loi) {
    return loi.portee === 'nationale' ? 'France entière' : `${loi.region} · ${loi.departement}`;
  }

  /** Remplit un <select> de régions, puis lie le <select> des départements. */
  function lierRegionDepartement(selectRegion, selectDept, { optionVideRegion, optionVideDept, valeurRegion = '', valeurDept = '' }) {
    selectRegion.innerHTML = `<option value="">${esc(optionVideRegion)}</option>` +
      Object.keys(REGIONS).map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
    selectRegion.value = valeurRegion;

    function majDepartements(valeur = '') {
      const depts = REGIONS[selectRegion.value] || [];
      selectDept.innerHTML = `<option value="">${esc(selectRegion.value ? optionVideDept : 'Région d’abord')}</option>` +
        depts.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
      selectDept.disabled = depts.length === 0;
      selectDept.value = valeur;
    }
    selectRegion.addEventListener('change', () => majDepartements());
    majDepartements(valeurDept);
  }

  /* ---------- Header, bandeau et pied de page communs ---------- */
  function pageCourante() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function renderHeader(user) {
    const header = document.getElementById('app-header');
    if (!header) return;
    const page = pageCourante();
    const lien = (href, nomIcone, label, badge = 0) => `
      <a href="${href}" ${page === href ? 'aria-current="page"' : ''}>
        ${icone(nomIcone)}<span>${label}</span>
        ${badge ? `<span class="pastille-compteur"><span class="sr-only">(</span>${badge}<span class="sr-only"> en attente)</span></span>` : ''}
      </a>`;

    let roleTexte = '';
    let nav = '';

    if (user) {
      const modeModo = estModeModeration(user);
      roleTexte = ROLES[user.role] + (user.role === 'moderateur' ? (modeModo ? ' · mode modération' : ' · mode citoyen') : '');

      nav += lien('accueil.html', 'maison', 'Accueil');
      nav += lien('creer-loi.html', 'plus', 'Créer une loi');
      if (modeModo) {
        nav += lien('moderation-lois.html', 'cloche', 'Alertes', compterAlertes());
        nav += lien('moderation-comptes.html', 'users', 'Comptes', compterDemandesComptes());
      }
      if (user.role === 'moderateur') {
        nav += `<button type="button" class="lien-nav" id="btn-changer-mode">${icone('echange')}<span>${modeModo ? 'Passer en mode citoyen' : 'Passer en mode modération'}</span></button>`;
      }
      nav += lien('compte.html', 'user', 'Mon compte');
      nav += lien('regles.html', 'info', 'Règles');
      nav += `<button type="button" class="lien-nav" id="btn-deconnexion">${icone('sortie')}<span>Déconnexion</span></button>`;

      // Sélecteur de rôle : uniquement pour faciliter la démonstration
      const roleSelectionne = Object.keys(COMPTES_DEMO).find(r => COMPTES_DEMO[r] === user.id) || '';
      nav += `
        <div class="demo-role">
          <label for="select-role">Mode démo</label>
          <select id="select-role" aria-describedby="aide-demo">
            ${roleSelectionne ? '' : '<option value="">Compte personnel</option>'}
            ${Object.keys(COMPTES_DEMO).map(r => `<option value="${r}" ${r === roleSelectionne ? 'selected' : ''}>${ROLES[r]}</option>`).join('')}
          </select>
          <span id="aide-demo" class="sr-only">Change de compte de démonstration pour tester chaque rôle.</span>
        </div>`;
    } else {
      nav += lien('index.html', 'cadenas', 'Connexion');
      nav += lien('inscription.html', 'user', 'Créer un compte');
      nav += lien('regles.html', 'info', 'Règles');
    }

    header.className = 'site-header';
    header.innerHTML = `
      <div class="header-barre">
        <a class="logo" href="${user ? 'accueil.html' : 'index.html'}" aria-label="AGORA, retour à l’accueil">
          <span class="logo-marque">${icone('agora')}</span>AGORA
        </a>
        ${roleTexte ? `<span class="role-actif"><span class="sr-only">Rôle actif : </span>${icone('user')}${esc(roleTexte)}</span>` : ''}
        <button type="button" class="btn-menu" aria-expanded="false" aria-controls="nav-principale">${icone('menu')}<span>Menu</span></button>
        <nav id="nav-principale" class="nav-principale" aria-label="Navigation principale">${nav}</nav>
      </div>
      ${lire(CLES.bandeau) ? '' : `<div class="bandeau-info" role="note">
        <p>${icone('info')}<span><strong>Avis consultatif et simulé :</strong> donner un avis « favorable » ou « défavorable » exprime si une idée vous plaît. Ce n’est pas un vote officiel. Toutes les données sont fictives.</span>
          <button type="button" class="bandeau-fermer" aria-label="Fermer le message « Avis consultatif et simulé »">${icone('croix')}</button></p>
      </div>`}`;

    // Fermeture du bandeau, mémorisée jusqu'à la réinitialisation des données
    const btnFermer = header.querySelector('.bandeau-fermer');
    if (btnFermer) btnFermer.addEventListener('click', () => {
      ecrire(CLES.bandeau, true);
      header.querySelector('.bandeau-info').remove();
      header.querySelector('.btn-menu').focus();
      annoncer('Message fermé. Ces informations restent dans le pied de page.');
    });

    // Menu mobile
    const boutonMenu = header.querySelector('.btn-menu');
    const navEl = header.querySelector('#nav-principale');
    boutonMenu.addEventListener('click', () => {
      const ouvert = boutonMenu.getAttribute('aria-expanded') === 'true';
      boutonMenu.setAttribute('aria-expanded', String(!ouvert));
      navEl.classList.toggle('ouverte', !ouvert);
    });

    const btnDeco = header.querySelector('#btn-deconnexion');
    if (btnDeco) btnDeco.addEventListener('click', deconnecter);

    const btnMode = header.querySelector('#btn-changer-mode');
    if (btnMode) btnMode.addEventListener('click', () => {
      basculerMode();
      // Si on quitte le mode modération depuis une page réservée, retour à l'accueil
      if (page.startsWith('moderation')) location.href = 'accueil.html';
      else location.reload();
    });

    const selectRole = header.querySelector('#select-role');
    if (selectRole) selectRole.addEventListener('change', () => {
      if (!selectRole.value) return;
      connecter(COMPTES_DEMO[selectRole.value]);
      location.href = 'accueil.html';
    });
  }

  function renderFooter() {
    const footer = document.getElementById('app-footer');
    if (!footer) return;
    footer.className = 'site-footer';
    footer.innerHTML = `<p>AGORA · prototype pédagogique « Design des usages 2027 » · données fictives, avis consultatifs et simulés · <a href="regles.html">Règles et transparence</a></p>`;
  }

  /**
   * Point d'entrée de chaque page.
   * options.auth : la page exige d'être connecté
   * options.moderation : la page exige le rôle modérateur en mode modération
   * Renvoie l'utilisateur courant (ou null si la page ne doit pas continuer).
   */
  async function demarrer(options = {}) {
    const main = document.getElementById('contenu');
    try {
      await chargerDonnees();
    } catch (e) {
      renderFooter();
      if (main) {
        main.innerHTML = `<div class="conteneur conteneur-etroit"><div class="alerte alerte-erreur" role="alert">${icone('alerte')}<div>
          <p><strong>Les données de démonstration n’ont pas pu être chargées.</strong></p>
          <p>Ouvrez le site avec un serveur local (extension Live Server de VS Code) ou via son adresse GitHub Pages, et non en double-cliquant sur le fichier.</p></div></div></div>`;
      }
      return null;
    }

    const user = utilisateurCourant();
    if (options.auth && !user) {
      location.href = 'index.html';
      return null;
    }
    renderHeader(user);
    renderFooter();

    if (options.moderation && !estModeModeration(user)) {
      main.innerHTML = `<div class="conteneur conteneur-etroit"><div class="carte vide">
        ${icone('cadenas')}<h1>Accès réservé</h1>
        <p>Cette page est réservée aux modérateurs en mode modération.</p>
        <a class="btn btn-primaire" href="accueil.html">Retour à l’accueil</a></div></div>`;
      return null;
    }
    return user || { anonyme: true };
  }

  /* ---------- API publique ---------- */
  return {
    ROLES, STATUTS, STATUTS_PUBLICS, THEMES, REGIONS, MOTIFS_SIGNALEMENT, ICONE_THEME, COMPTES_DEMO,
    icone, demarrer, reinitialiser, renderHeader,
    getLois, getLoi, saveLoi, getUsers, getUser, saveUser,
    utilisateurCourant, connecter, deconnecter, authentifier, estModeModeration,
    getAvis, donnerAvis, compterAlertes, compterDemandesComptes,
    ajouterJournal, getJournal, libelleDecision,
    esc, paragraphes, formatDate, formatNombre, pseudo, badgeStatut, pourcentages, normaliser, genererId,
    annoncer, afficherErreur, effacerErreur, valider, estEmail, age, lierRegionDepartement, lieu
  };
})();
