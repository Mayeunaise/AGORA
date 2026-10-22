/* =========================================================
   AGORA — js/inscription.js
   Création de compte citoyen (+ demande facultative de statut
   « responsable institutionnel », validée ensuite par un modérateur).
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer();
  if (!user) return;
  if (!user.anonyme) {
    location.href = 'accueil.html';
    return;
  }

  const $ = id => document.getElementById(id);
  const form = $('form-inscription');
  const caseInstitution = $('demande-institution');
  const blocInstitution = $('bloc-institution');

  // La date de naissance ne peut pas être dans le futur
  $('date-naissance').max = new Date().toISOString().slice(0, 10);

  // Affiche les champs institutionnels seulement si la case est cochée
  caseInstitution.addEventListener('change', () => {
    blocInstitution.hidden = !caseInstitution.checked;
    caseInstitution.setAttribute('aria-expanded', String(caseInstitution.checked));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const emailExiste = v => !AGORA.getUsers().some(u => u.email.toLowerCase() === v.toLowerCase());
    const regles = [
      { champ: $('prenom'), test: v => v.length >= 2, message: 'Saisissez votre prénom (2 caractères minimum).' },
      { champ: $('nom'), test: v => v.length >= 2, message: 'Saisissez votre nom (2 caractères minimum).' },
      { champ: $('email'), test: v => v.length > 0, message: 'Saisissez votre adresse mail.' },
      { champ: $('email'), test: AGORA.estEmail, message: 'Format d’adresse mail invalide (exemple : nom@domaine.fr).' },
      { champ: $('email'), test: emailExiste, message: 'Un compte existe déjà avec cette adresse. Connectez-vous plutôt.' },
      { champ: $('date-naissance'), test: v => v.length > 0, message: 'Indiquez votre date de naissance.' },
      { champ: $('date-naissance'), test: v => AGORA.age(v) >= 0 && AGORA.age(v) <= 120, message: 'Date de naissance invalide.' },
      { champ: $('date-naissance'), test: v => AGORA.age(v) >= 15, message: 'Il faut avoir au moins 15 ans pour créer un compte.' },
      { champ: $('mot-de-passe'), test: v => v.length >= 8, message: 'Le mot de passe doit contenir au moins 8 caractères.' },
      { champ: $('mot-de-passe-2'), test: v => v === $('mot-de-passe').value.trim() && v.length > 0, message: 'Les deux mots de passe ne correspondent pas.' }
    ];
    if (caseInstitution.checked) {
      regles.push(
        { champ: $('organisme'), test: v => v.length >= 3, message: 'Indiquez l’organisme que vous représentez.' },
        { champ: $('fonction'), test: v => v.length >= 3, message: 'Indiquez votre fonction.' }
      );
    }
    regles.push({ champ: $('accepte-regles'), test: () => $('accepte-regles').checked, message: 'Vous devez avoir lu les règles pour créer un compte.' });

    if (!AGORA.valider(regles)) return;

    const nouveau = {
      id: AGORA.genererId('u'),
      prenom: $('prenom').value.trim(),
      nom: $('nom').value.trim(),
      email: $('email').value.trim(),
      motDePasse: $('mot-de-passe').value.trim(), // stocké en clair : SIMULATION uniquement
      dateNaissance: $('date-naissance').value,
      genre: $('genre').value,
      role: 'citoyen',
      dateInscription: new Date().toISOString(),
      demandeInstitution: caseInstitution.checked ? {
        organisme: $('organisme').value.trim(),
        fonction: $('fonction').value.trim(),
        date: new Date().toISOString(),
        statut: 'en attente',
        justification: ''
      } : null
    };

    if (!AGORA.saveUser(nouveau)) return;
    AGORA.connecter(nouveau.id);
    location.href = 'accueil.html?bienvenue=1';
  });
});
