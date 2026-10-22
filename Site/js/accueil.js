/* =========================================================
   AGORA — js/accueil.js
   Liste des propositions publiques, triées par défaut par
   nombre d'avis favorables, avec recherche, pastilles de statut
   et filtres région / département. Les lois adoptées ont leur page.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer({ auth: true });
  if (!user) return;

  const $ = id => document.getElementById(id);
  const form = $('form-filtres');
  const recherche = $('recherche');
  const region = $('filtre-region');
  const departement = $('filtre-departement');
  const pucesStatut = $('puces-statut');
  const A = AGORA;
  // Statuts affichés sur l'accueil, dans l'ordre du parcours d'une loi
  const STATUTS_ACCUEIL = ['en-discussion', 'examinee', 'cloturee'];
  const tri = $('tri');
  const liste = $('liste-lois');
  const nbResultats = $('nb-resultats');

  /* --- Message après inscription --- */
  if (new URLSearchParams(location.search).get('bienvenue')) {
    const demande = user.demandeInstitution && user.demandeInstitution.statut === 'en attente';
    $('message-bienvenue').innerHTML = `
      <div class="alerte alerte-succes" role="status">${AGORA.icone('check')}
        <div><p><strong>Bienvenue ${AGORA.esc(user.prenom)} !</strong> Votre compte est créé.</p>
        ${demande ? '<p>Votre demande de statut « responsable institutionnel » a été transmise à la modération. Vous pouvez suivre son traitement dans « Mon compte ».</p>' : ''}</div>
      </div>`;
  }

  /* --- Pastilles de statut (plusieurs choix possibles) --- */
  pucesStatut.innerHTML = STATUTS_ACCUEIL.map(s => `
    <label class="statut statut-${s} puce-statut" title="${A.esc(A.STATUTS[s].aide)}">
      <input type="checkbox" name="statut" value="${s}">
      <span class="pastille" aria-hidden="true"></span>${A.icone('check', 'coche')}${A.esc(A.STATUTS[s].label)}
    </label>`).join('');
  const statutsChoisis = () => [...pucesStatut.querySelectorAll('input:checked')].map(c => c.value);

  /* --- Présentation de l'app : ouverte automatiquement à la première visite --- */
  $('btn-presentation').addEventListener('click', A.ouvrirPresentation);
  if (!A.presentationVue()) A.ouvrirPresentation();

  // Neutralité : en mode modération, pas de création de loi
  if (A.estModeModeration(user)) $('btn-creer').hidden = true;

  AGORA.lierRegionDepartement(region, departement, {
    optionVideRegion: 'Toutes les régions',
    optionVideDept: 'Tous les départements'
  });

  /* --- Construction d'une carte de proposition --- */
  function carteLoi(loi) {
    const p = AGORA.pourcentages(loi);
    const visuel = loi.photo
      ? `<img src="${loi.photo}" alt="" loading="lazy">`
      : AGORA.icone(AGORA.ICONE_THEME[AGORA.themesDe(loi)[0]] || 'agora');
    return `
      <article class="carte-loi">
        <div class="carte-loi-visuel">${visuel}</div>
        <div class="carte-loi-corps">
          <div class="carte-loi-meta">${AGORA.badgeStatut(loi.statut)}${AGORA.etiquettesThemes(loi)}</div>
          <h3><a href="loi.html?id=${encodeURIComponent(loi.id)}">${AGORA.esc(loi.titre)}</a></h3>
          <span class="lieu">${AGORA.icone('epingle')}${AGORA.esc(AGORA.lieu(loi))}</span>
          <div class="carte-loi-pied">
            <div class="barre-avis" aria-hidden="true">
              <span class="part-pour" style="width:${p.pour}%"></span><span class="part-contre" style="width:${p.contre}%"></span>
            </div>
            <span><strong>${p.pour} % favorables</strong> · ${AGORA.formatNombre(p.total)} participants</span>
            <span>${AGORA.icone('bulle')} ${loi.messages.length} message${loi.messages.length > 1 ? 's' : ''} dans le débat</span>
          </div>
        </div>
      </article>`;
  }

  /* --- Filtrage, tri et affichage --- */
  function afficher() {
    const mots = AGORA.normaliser(recherche.value.trim()).split(/\s+/).filter(Boolean);
    const toutes = AGORA.getLois();
    let lois = toutes.filter(l => STATUTS_ACCUEIL.includes(l.statut));

    if (mots.length) {
      lois = lois.filter(l => {
        const texte = AGORA.normaliser(`${l.titre} ${l.description} ${l.descriptionOfficielle} ${AGORA.themesDe(l).join(' ')} ${AGORA.lieu(l)} ${l.portee || ''}`);
        return mots.every(m => texte.includes(m));
      });
    }
    if (region.value) lois = lois.filter(l => l.region === region.value);
    if (departement.value) lois = lois.filter(l => l.departement === departement.value);
    const choisis = statutsChoisis();
    if (choisis.length) lois = lois.filter(l => choisis.includes(l.statut));

    const comparateurs = {
      popularite: (a, b) => b.pour - a.pour,
      recent: (a, b) => new Date(b.dateCreation) - new Date(a.dateCreation),
      debat: (a, b) => b.messages.length - a.messages.length,
      participation: (a, b) => (b.pour + b.contre) - (a.pour + a.contre)
    };
    lois.sort(comparateurs[tri.value] || comparateurs.popularite);

    nbResultats.textContent = lois.length
      ? `${lois.length} proposition${lois.length > 1 ? 's' : ''} trouvée${lois.length > 1 ? 's' : ''}`
      : 'Aucune proposition ne correspond à vos critères.';

    // Une section par statut, dans l'ordre du parcours d'une loi
    const sections = STATUTS_ACCUEIL
      .map(s => ({ statut: s, lois: lois.filter(l => l.statut === s) }))
      .filter(g => g.lois.length)
      .map(g => `
        <section class="groupe-lois" aria-labelledby="titre-${g.statut}">
          <div class="groupe-lois-entete">
            <h2 id="titre-${g.statut}">${AGORA.esc(AGORA.STATUTS[g.statut].label)}
              <span class="groupe-lois-nb">${g.lois.length}</span></h2>
            <p class="aide">${AGORA.esc(AGORA.STATUTS[g.statut].aide)}</p>
          </div>
          <div class="grille-lois">${g.lois.map(carteLoi).join('')}</div>
        </section>`);

    liste.innerHTML = sections.length
      ? sections.join('')
      : `<div class="carte vide"><p>Essayez un autre mot-clé ou élargissez la zone géographique.</p>
         <p>Votre idée n’existe pas encore ? <a href="creer-loi.html">Proposez-la</a>.</p></div>`;

    const nbAdoptees = toutes.filter(l => l.statut === 'adoptee').length;
    $('resume-adoptees').textContent = nbAdoptees
      ? `${nbAdoptees} proposition${nbAdoptees > 1 ? 's' : ''} citoyenne${nbAdoptees > 1 ? 's ont' : ' a'} déjà été mise${nbAdoptees > 1 ? 's' : ''} en place par les institutions.`
      : 'Aucune proposition n’a encore été mise en place.';
  }

  // Mise à jour en direct à chaque changement
  recherche.addEventListener('input', afficher);
  [region, departement, pucesStatut, tri].forEach(el => el.addEventListener('change', afficher));
  form.addEventListener('submit', e => { e.preventDefault(); afficher(); });
  form.addEventListener('reset', () => {
    // Attendre que le navigateur ait réinitialisé les champs
    setTimeout(() => {
      region.dispatchEvent(new Event('change'));
      afficher();
      recherche.focus();
    }, 0);
  });

  // Base en ligne : la liste se met à jour quand quelqu'un publie ou donne un avis
  document.addEventListener('agora:donnees', e => { if (e.detail === 'lois') afficher(); });

  afficher();
});
