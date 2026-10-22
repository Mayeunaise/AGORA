/* =========================================================
   AGORA — js/compte.js
   Espace personnel : données modifiables, suivi de ses
   propositions, demande de statut institutionnel.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  let user = await AGORA.demarrer({ auth: true });
  if (!user) return;

  const A = AGORA;
  const $ = id => document.getElementById(id);

  function resume() {
    $('resume-compte').textContent =
      `${A.pseudo(user)} · ${A.ROLES[user.role]} · inscrit·e le ${A.formatDate(user.dateInscription)}`;
  }

  /* ---------- Informations personnelles ---------- */
  const champs = ['prenom', 'nom', 'email', 'genre'];
  champs.forEach(c => { $(c).value = user[c] || ''; });
  $('date-naissance').value = user.dateNaissance || '';
  $('date-naissance').max = new Date().toISOString().slice(0, 10);
  if (!$('genre').value) $('genre').value = 'non-precise';

  $('form-compte').addEventListener('submit', e => {
    e.preventDefault();
    const emailLibre = v => !A.getUsers().some(u => u.id !== user.id && u.email.toLowerCase() === v.toLowerCase());
    const ok = A.valider([
      { champ: $('prenom'), test: v => v.length >= 2, message: 'Saisissez votre prénom (2 caractères minimum).' },
      { champ: $('nom'), test: v => v.length >= 2, message: 'Saisissez votre nom (2 caractères minimum).' },
      { champ: $('email'), test: A.estEmail, message: 'Format d’adresse mail invalide (exemple : nom@domaine.fr).' },
      { champ: $('email'), test: emailLibre, message: 'Cette adresse est déjà utilisée par un autre compte.' },
      { champ: $('date-naissance'), test: v => A.age(v) >= 15 && A.age(v) <= 120, message: 'Date de naissance invalide (15 ans minimum).' }
    ]);
    if (!ok) return;

    user = A.getUser(user.id);
    user.prenom = $('prenom').value.trim();
    user.nom = $('nom').value.trim();
    user.email = $('email').value.trim();
    user.dateNaissance = $('date-naissance').value;
    user.genre = $('genre').value;
    if (A.saveUser(user)) {
      resume();
      A.annoncer('Vos informations ont été enregistrées.');
    }
  });

  /* ---------- Mes propositions ---------- */
  function afficherPropositions() {
    const mesLois = A.getLois()
      .filter(l => l.auteurId === user.id)
      .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

    $('liste-props').innerHTML = mesLois.length
      ? `<ul class="liste-simple">${mesLois.map(l => `
          <li>
            <div class="carte-loi-meta">${A.badgeStatut(l.statut)}<span class="aide">${A.formatDate(l.dateCreation)}</span></div>
            <p style="margin:.35rem 0"><a href="loi.html?id=${encodeURIComponent(l.id)}"><strong>${A.esc(l.titre)}</strong></a></p>
            ${l.moderation && l.moderation.decision !== 'acceptee'
              ? `<p class="aide">${A.icone('bouclier')} ${A.esc(A.libelleDecision(l.moderation.decision))} par la modération : ${A.esc(l.moderation.justification)}</p>` : ''}
            ${l.reponseOfficielle ? `<p class="aide">${A.icone('check')} L’institution a publié une réponse officielle.</p>` : ''}
            ${A.STATUTS_PUBLICS.includes(l.statut) ? `<p class="aide">${A.formatNombre(l.pour + l.contre)} participants · ${l.messages.length} message(s)</p>` : ''}
          </li>`).join('')}</ul>`
      : '<p class="vide">Vous n’avez pas encore proposé de loi.</p>';
  }

  /* ---------- Statut institutionnel ---------- */
  function afficherInstitution() {
    const zone = $('zone-institution');
    const d = user.demandeInstitution;

    if (user.role === 'institution') {
      zone.innerHTML = `<div class="alerte alerte-succes">${A.icone('check')}<p>Vous êtes responsable institutionnel${d ? ` (${A.esc(d.fonction)}, ${A.esc(d.organisme)})` : ''}. Vous pouvez rédiger des descriptions officielles, répondre aux propositions et changer leur statut depuis chaque fiche.</p></div>`;
      return;
    }
    if (user.role === 'moderateur') {
      zone.innerHTML = '<p class="aide">Les modérateurs ne peuvent pas cumuler le statut institutionnel, pour garantir leur neutralité.</p>';
      return;
    }
    if (d && d.statut === 'en attente') {
      zone.innerHTML = `<div class="alerte alerte-info">${A.icone('info')}<p>Demande envoyée le ${A.formatDate(d.date)} (${A.esc(d.fonction)}, ${A.esc(d.organisme)}). Elle est en attente de vérification par un modérateur.</p></div>`;
      return;
    }

    const refus = d && d.statut === 'refusee'
      ? `<div class="alerte alerte-erreur">${A.icone('alerte')}<p>Votre précédente demande a été refusée. Justification : ${A.esc(d.justification)}</p></div>` : '';

    zone.innerHTML = `${refus}
      <p class="aide">Vous représentez une institution publique ? Demandez ce statut pour publier des réponses officielles. Un modérateur vérifiera votre demande.</p>
      <form id="form-demande" novalidate>
        <div class="grille-2">
          <div class="champ"><label for="organisme">Organisme <span class="obligatoire" aria-hidden="true">*</span></label><input type="text" id="organisme"></div>
          <div class="champ"><label for="fonction">Fonction <span class="obligatoire" aria-hidden="true">*</span></label><input type="text" id="fonction"></div>
        </div>
        <button type="submit" class="btn btn-secondaire">Envoyer la demande</button>
      </form>`;

    $('form-demande').addEventListener('submit', e => {
      e.preventDefault();
      const ok = A.valider([
        { champ: $('organisme'), test: v => v.length >= 3, message: 'Indiquez l’organisme que vous représentez.' },
        { champ: $('fonction'), test: v => v.length >= 3, message: 'Indiquez votre fonction.' }
      ]);
      if (!ok) return;
      user = A.getUser(user.id);
      user.demandeInstitution = {
        organisme: $('organisme').value.trim(),
        fonction: $('fonction').value.trim(),
        date: new Date().toISOString(),
        statut: 'en attente',
        justification: ''
      };
      A.saveUser(user);
      afficherInstitution();
      A.annoncer('Demande envoyée à la modération.');
    });
  }

  /* ---------- Déconnexion et réinitialisation ---------- */
  $('btn-deco').addEventListener('click', A.deconnecter);
  $('btn-reinit').addEventListener('click', () => {
    if (confirm('Réinitialiser la démonstration ? Toutes les modifications faites dans ce navigateur seront effacées.')) {
      A.reinitialiser();
    }
  });

  resume();
  afficherPropositions();
  afficherInstitution();
  if (location.hash === '#mes-propositions') $('mes-propositions').focus();
});
