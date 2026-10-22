/* =========================================================
   AGORA — js/accueil.js
   Liste des propositions publiques, triées par défaut par
   nombre d'avis favorables, avec recherche et filtres
   région / département / statut.
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
  const statut = $('filtre-statut');
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

  AGORA.lierRegionDepartement(region, departement, {
    optionVideRegion: 'Toutes les régions',
    optionVideDept: 'Tous les départements'
  });

  /* --- Construction d'une carte de proposition --- */
  function carteLoi(loi) {
    const p = AGORA.pourcentages(loi);
    const visuel = loi.photo
      ? `<img src="${loi.photo}" alt="" loading="lazy">`
      : AGORA.icone(AGORA.ICONE_THEME[loi.theme] || 'agora');
    return `
      <article class="carte-loi">
        <div class="carte-loi-visuel">${visuel}</div>
        <div class="carte-loi-corps">
          <div class="carte-loi-meta">${AGORA.badgeStatut(loi.statut)}<span class="etiquette">${AGORA.esc(loi.theme)}</span></div>
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
    let lois = AGORA.getLois().filter(l => AGORA.STATUTS_PUBLICS.includes(l.statut));

    if (mots.length) {
      lois = lois.filter(l => {
        const texte = AGORA.normaliser(`${l.titre} ${l.description} ${l.descriptionOfficielle} ${l.theme} ${AGORA.lieu(l)} ${l.portee || ''}`);
        return mots.every(m => texte.includes(m));
      });
    }
    if (region.value) lois = lois.filter(l => l.region === region.value);
    if (departement.value) lois = lois.filter(l => l.departement === departement.value);
    if (statut.value) lois = lois.filter(l => l.statut === statut.value);

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
    const sections = ['en-discussion', 'examinee', 'cloturee']
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
  }

  // Mise à jour en direct à chaque changement
  recherche.addEventListener('input', afficher);
  [region, departement, statut, tri].forEach(el => el.addEventListener('change', afficher));
  form.addEventListener('submit', e => { e.preventDefault(); afficher(); });
  form.addEventListener('reset', () => {
    // Attendre que le navigateur ait réinitialisé les champs
    setTimeout(() => {
      region.dispatchEvent(new Event('change'));
      afficher();
      recherche.focus();
    }, 0);
  });

  afficher();
});
