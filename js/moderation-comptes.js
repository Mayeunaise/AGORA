/* =========================================================
   AGORA — js/moderation-comptes.js
   Le modérateur accepte ou refuse les demandes de statut
   « responsable institutionnel », avec justification obligatoire.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer({ auth: true, moderation: true });
  if (!user) return;

  const A = AGORA;
  const $ = id => document.getElementById(id);

  function elementDemande(u) {
    const d = u.demandeInstitution;
    const i = A.esc(u.id);
    return `
      <article class="carte element-moderation" aria-labelledby="nom-${i}">
        <h3 id="nom-${i}">${A.esc(u.prenom)} ${A.esc(u.nom)}</h3>
        <ul class="liste-simple">
          <li><strong>Organisme :</strong> ${A.esc(d.organisme)}</li>
          <li><strong>Fonction :</strong> ${A.esc(d.fonction)}</li>
          <li><strong>Adresse mail :</strong> ${A.esc(u.email)}</li>
          <li><strong>Demande envoyée le :</strong> ${A.formatDate(d.date, true)}</li>
        </ul>
        <form data-user="${i}" novalidate>
          <div class="champ" style="margin-top:1rem">
            <label for="justif-${i}">Justification de la décision <span class="obligatoire" aria-hidden="true">*</span></label>
            <textarea id="justif-${i}" rows="3" aria-describedby="justif-aide-${i}"></textarea>
            <p id="justif-aide-${i}" class="aide">Transmise au demandeur dans son espace « Mon compte ».</p>
          </div>
          <div class="actions">
            <button type="submit" value="acceptee" class="btn btn-succes">${A.icone('check')}Accepter<span class="sr-only"> la demande de ${A.esc(u.prenom)} ${A.esc(u.nom)}</span></button>
            <button type="submit" value="refusee" class="btn btn-danger">${A.icone('croix')}Refuser<span class="sr-only"> la demande de ${A.esc(u.prenom)} ${A.esc(u.nom)}</span></button>
          </div>
        </form>
      </article>`;
  }

  function afficher() {
    const users = A.getUsers().filter(u => u.demandeInstitution);
    const enAttente = users.filter(u => u.demandeInstitution.statut === 'en attente');
    const traitees = users.filter(u => u.demandeInstitution.statut !== 'en attente');

    $('nb-attente').textContent = `(${enAttente.length})`;
    $('liste-attente').innerHTML = enAttente.length
      ? enAttente.map(elementDemande).join('')
      : `<p class="carte vide">${A.icone('check')} Aucune demande en attente.</p>`;

    $('liste-traitees').innerHTML = traitees.length
      ? `<ul class="liste-simple">${traitees.map(u => `
          <li><strong>${A.esc(u.prenom)} ${A.esc(u.nom)}</strong> · ${A.esc(u.demandeInstitution.organisme)} —
            <span class="statut ${u.demandeInstitution.statut === 'acceptee' ? 'statut-cloturee' : 'statut-refusee'}"><span class="pastille" aria-hidden="true"></span>${u.demandeInstitution.statut === 'acceptee' ? 'Acceptée' : 'Refusée'}</span>
            <br><span class="aide">${A.esc(u.demandeInstitution.justification)}</span></li>`).join('')}</ul>`
      : '<p class="vide">Aucune demande traitée.</p>';

    A.renderHeader(user); // met à jour le badge « Comptes »
  }

  document.addEventListener('submit', e => {
    const form = e.target;
    if (!form.dataset.user) return;
    e.preventDefault();
    const decision = e.submitter ? e.submitter.value : '';
    const justif = form.querySelector(`#justif-${CSS.escape(form.dataset.user)}`);
    const ok = A.valider([
      { champ: justif, test: v => v.length >= 10, message: 'La justification est obligatoire (10 caractères minimum).' }
    ]);
    if (!ok) return;

    const demandeur = A.getUser(form.dataset.user);
    demandeur.demandeInstitution.statut = decision;
    demandeur.demandeInstitution.justification = justif.value.trim();
    if (decision === 'acceptee') demandeur.role = 'institution';
    A.saveUser(demandeur);

    afficher();
    $('titre-attente').focus();
    A.annoncer(decision === 'acceptee'
      ? `${demandeur.prenom} ${demandeur.nom} est désormais responsable institutionnel.`
      : 'Demande refusée. Le demandeur verra votre justification.');
  });

  afficher();
});
