/* =========================================================
   AGORA — js/index.js
   Page d'authentification (simulée).
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer();
  if (!user) return;
  // Déjà connecté : direction l'accueil
  if (!user.anonyme) {
    location.href = 'accueil.html';
    return;
  }

  const form = document.getElementById('form-connexion');
  const email = document.getElementById('email');
  const motDePasse = document.getElementById('mot-de-passe');
  const zoneErreur = document.getElementById('erreur-connexion');

  document.getElementById('btn-presentation').addEventListener('click', AGORA.ouvrirPresentation);

  /* --- Comptes de démonstration --- */
  const zoneDemo = document.getElementById('comptes-demo');
  zoneDemo.innerHTML = Object.entries(AGORA.COMPTES_DEMO).map(([role, id]) => {
    const u = AGORA.getUser(id);
    if (!u) return '';
    return `
      <div class="compte-demo">
        <div>
          <strong>${AGORA.esc(AGORA.ROLES[role])}</strong><br>
          <code>${AGORA.esc(u.email)}</code>
        </div>
        <button type="button" class="btn btn-secondaire" data-email="${AGORA.esc(u.email)}">
          Utiliser<span class="sr-only"> le compte ${AGORA.esc(AGORA.ROLES[role])}</span>
        </button>
      </div>`;
  }).join('');

  zoneDemo.addEventListener('click', e => {
    const bouton = e.target.closest('button[data-email]');
    if (!bouton) return;
    email.value = bouton.dataset.email;
    motDePasse.value = 'demo1234';
    form.querySelector('button[type="submit"]').focus();
    AGORA.annoncer('Formulaire rempli. Validez pour vous connecter.');
  });

  /* --- Soumission --- */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    zoneErreur.innerHTML = '';
    const ok = AGORA.valider([
      { champ: email, test: v => v.length > 0, message: 'Saisissez votre adresse mail.' },
      { champ: email, test: AGORA.estEmail, message: 'Format d’adresse mail invalide (exemple : nom@domaine.fr).' },
      { champ: motDePasse, test: v => v.length > 0, message: 'Saisissez votre mot de passe.' }
    ]);
    if (!ok) return;

    let compte;
    try {
      compte = await AGORA.authentifier(email.value, motDePasse.value);
    } catch (err) {
      zoneErreur.innerHTML = `<div class="alerte alerte-erreur" role="alert">${AGORA.icone('alerte')}<p>Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.</p></div>`;
      return;
    }
    if (!compte) {
      // Message volontairement générique : on ne révèle pas si l'adresse existe
      zoneErreur.innerHTML = `<div class="alerte alerte-erreur" role="alert">${AGORA.icone('alerte')}<p>Adresse mail ou mot de passe incorrect. Vérifiez votre saisie ou utilisez un compte de démonstration.</p></div>`;
      motDePasse.value = '';
      motDePasse.focus();
      return;
    }
    AGORA.connecter(compte.id);
    location.href = 'accueil.html';
  });
});
