/* =========================================================
   AGORA — js/index.js
   Page de présentation du projet, visible avant connexion :
   chiffres clés et proposition la plus soutenue du moment.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer();
  if (!user) return;

  const A = AGORA;
  const $ = id => document.getElementById(id);

  $('btn-presentation').addEventListener('click', A.ouvrirPresentation);

  // Déjà connecté : un seul bouton vers les propositions
  if (!user.anonyme) {
    $('actions-vitrine').innerHTML = `<a class="btn btn-accent" href="accueil.html">Voir les propositions</a>`;
  }

  function afficher() {
    const lois = A.getLois();
    const publiques = lois.filter(l => A.STATUTS_PUBLICS.includes(l.statut));
    const participants = publiques.reduce((s, l) => s + l.pour + l.contre, 0);
    const messages = publiques.reduce((s, l) => s + l.messages.length, 0);
    const adoptees = lois.filter(l => l.statut === 'adoptee').length;

    const chiffre = (valeur, libelle) => `<div class="chiffre"><span class="valeur">${valeur}</span><span class="libelle">${libelle}</span></div>`;
    $('chiffres-vitrine').innerHTML = [
      chiffre(A.formatNombre(publiques.length), 'propositions publiées'),
      chiffre(A.formatNombre(participants), 'avis donnés'),
      chiffre(A.formatNombre(messages), 'messages dans les débats'),
      chiffre(A.formatNombre(adoptees), `loi${adoptees > 1 ? 's' : ''} adoptée${adoptees > 1 ? 's' : ''}`)
    ].join('');

    // Proposition en discussion la plus soutenue
    const vedette = lois.filter(l => l.statut === 'en-discussion').sort((a, b) => b.pour - a.pour)[0];
    if (!vedette) { $('proposition-vedette').hidden = true; return; }
    const p = A.pourcentages(vedette);
    $('proposition-vedette').innerHTML = `
      <p class="vedette-titre">En ce moment</p>
      <article class="carte">
        <div class="carte-loi-meta">${A.badgeStatut(vedette.statut)}${A.etiquettesThemes(vedette)}</div>
        <h2>${A.esc(vedette.titre)}</h2>
        <span class="lieu">${A.icone('epingle')}${A.esc(A.lieu(vedette))}</span>
        <div class="barre-avis" aria-hidden="true">
          <span class="part-pour" style="width:${p.pour}%"></span><span class="part-contre" style="width:${p.contre}%"></span>
        </div>
        <p class="aide"><strong>${p.pour} % favorables</strong> · ${A.formatNombre(p.total)} participants · ${vedette.messages.length} message${vedette.messages.length > 1 ? 's' : ''}</p>
        <a class="btn btn-secondaire" href="${user.anonyme ? 'connexion.html' : `loi.html?id=${encodeURIComponent(vedette.id)}`}">${user.anonyme ? 'Se connecter pour donner mon avis' : 'Voir la proposition'}</a>
      </article>`;
  }

  document.addEventListener('agora:donnees', e => { if (e.detail === 'lois') afficher(); });
  afficher();
});
