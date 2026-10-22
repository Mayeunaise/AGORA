/* =========================================================
   AGORA — js/lois-adoptees.js
   Page « Lois adoptées » : chiffres clés, répartition par
   thème et liste des mesures mises en place.
   Accessible sans compte.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer();
  if (!user) return;

  const A = AGORA;
  const $ = id => document.getElementById(id);
  const JOUR = 24 * 60 * 60 * 1000;

  function afficher() {
    const lois = A.getLois();
    const adoptees = lois.filter(l => l.statut === 'adoptee')
      .sort((a, b) => new Date(b.dateAdoption || 0) - new Date(a.dateAdoption || 0));
    const repondues = lois.filter(l => l.statut === 'cloturee' || l.statut === 'adoptee');

    /* --- Chiffres clés --- */
    const moyenne = valeurs => valeurs.length ? valeurs.reduce((s, v) => s + v, 0) / valeurs.length : 0;
    const participants = adoptees.reduce((s, l) => s + l.pour + l.contre, 0);
    const soutien = Math.round(moyenne(adoptees.map(l => A.pourcentages(l).pour)));
    const delais = adoptees.filter(l => l.dateAdoption)
      .map(l => (new Date(l.dateAdoption) - new Date(l.dateCreation)) / JOUR);
    const delaiMoyen = Math.round(moyenne(delais));
    const taux = repondues.length ? Math.round((adoptees.length * 100) / repondues.length) : 0;
    const nationales = adoptees.filter(l => l.portee === 'nationale').length;

    const chiffre = (valeur, libelle) => `<div class="chiffre"><span class="valeur">${valeur}</span><span class="libelle">${libelle}</span></div>`;
    $('chiffres-cles').innerHTML = [
      chiffre(adoptees.length, `loi${adoptees.length > 1 ? 's' : ''} adoptée${adoptees.length > 1 ? 's' : ''}`),
      chiffre(`${taux} %`, `des propositions ayant reçu une réponse ont été adoptées (${adoptees.length} sur ${repondues.length})`),
      chiffre(`${soutien} %`, 'd’avis favorables en moyenne sur les lois adoptées'),
      chiffre(A.formatNombre(participants), 'participants aux avis sur ces lois'),
      chiffre(`${delaiMoyen} j`, 'en moyenne entre la proposition et la mise en place'),
      chiffre(`${nationales} / ${adoptees.length - nationales}`, 'nationales / locales')
    ].join('');

    /* --- Répartition par thème --- */
    const parTheme = {};
    adoptees.forEach(l => A.themesDe(l).forEach(t => { parTheme[t] = (parTheme[t] || 0) + 1; }));
    const themes = Object.entries(parTheme).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const max = themes.length ? themes[0][1] : 1;
    $('barres-themes').innerHTML = themes.length
      ? themes.map(([theme, nb]) => `
          <li style="${A.styleTheme(theme)}">
            <span>${A.esc(theme)}</span>
            <span class="piste" aria-hidden="true"><span class="rempli" style="width:${(nb * 100) / max}%"></span></span>
            <span class="nombre">${nb}<span class="sr-only"> loi${nb > 1 ? 's' : ''}</span></span>
          </li>`).join('')
      : '<li class="vide">Aucune loi adoptée pour le moment.</li>';

    /* --- Liste des mesures --- */
    $('liste-adoptees').innerHTML = adoptees.length
      ? adoptees.map(l => {
          const p = A.pourcentages(l);
          const delai = l.dateAdoption ? Math.round((new Date(l.dateAdoption) - new Date(l.dateCreation)) / JOUR) : null;
          return `
            <li class="carte loi-adoptee">
              <div class="carte-loi-meta">${A.badgeStatut('adoptee')}${A.etiquettesThemes(l)}</div>
              <h3><a href="loi.html?id=${encodeURIComponent(l.id)}">${A.esc(l.titre)}</a></h3>
              <p class="aide">${A.icone('epingle')} ${A.esc(A.lieu(l))} · proposée par ${A.esc(l.auteurPseudo)} le ${A.formatDate(l.dateCreation)}
                ${l.dateAdoption ? ` · mise en place le <strong>${A.formatDate(l.dateAdoption)}</strong>${delai !== null ? ` (${delai} jours plus tard)` : ''}` : ''}</p>
              ${l.reponseOfficielle ? `<div class="mise-en-place">${A.paragraphes(l.reponseOfficielle.texte)}<p class="aide">${A.esc(l.reponseOfficielle.auteur)}</p></div>` : ''}
              <p class="aide"><strong>${p.pour} % favorables</strong> sur ${A.formatNombre(p.total)} participants · ${l.messages.length} message${l.messages.length > 1 ? 's' : ''} dans le débat</p>
            </li>`;
        }).join('')
      : '<li class="carte vide">Aucune proposition n’a encore été mise en place.</li>';
  }

  document.addEventListener('agora:donnees', e => { if (e.detail === 'lois') afficher(); });
  afficher();
});
