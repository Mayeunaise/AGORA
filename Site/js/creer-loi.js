/* =========================================================
   AGORA — js/creer-loi.js
   Formulaire de proposition : titre, photo (aperçu), description,
   thème, portée (nationale ou locale : région / département). La loi créée est « soumise »
   et attend la validation d'un modérateur.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer({ auth: true });
  if (!user) return;

  const A = AGORA;
  const $ = id => document.getElementById(id);
  const form = $('form-loi');
  const titre = $('titre');
  const description = $('description');
  const photo = $('photo');
  const apercu = $('apercu-photo');
  const apercuImg = $('apercu-img');
  let photoDataUrl = '';

  $('pseudo-affiche').textContent = `« ${A.pseudo(user)} »`;
  $('theme').innerHTML = '<option value="">Choisissez un thème</option>' +
    A.THEMES.map(t => `<option value="${A.esc(t)}">${A.esc(t)}</option>`).join('');
  A.lierRegionDepartement($('region'), $('departement'), {
    optionVideRegion: 'Choisissez une région',
    optionVideDept: 'Choisissez un département'
  });

  /* --- Portée : une loi nationale n'a ni région ni département --- */
  const blocLieu = $('bloc-lieu');
  const estNationale = () => $('portee-nationale').checked;
  document.querySelectorAll('input[name="portee"]').forEach(radio => radio.addEventListener('change', () => {
    blocLieu.hidden = estNationale();
    if (estNationale()) [$('region'), $('departement')].forEach(A.effacerErreur);
  }));

  /* --- Compteurs de caractères --- */
  [[titre, 'titre-compteur', 120], [description, 'description-compteur', 2000]].forEach(([champ, idCompteur, max]) => {
    champ.addEventListener('input', () => { $(idCompteur).textContent = `${champ.value.length} / ${max}`; });
  });

  /* --- Photo : redimensionnée pour tenir dans le stockage local --- */
  function redimensionner(fichier) {
    return new Promise((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onerror = reject;
      lecteur.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const largeurMax = 900;
          const ratio = Math.min(1, largeurMax / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.src = lecteur.result;
      };
      lecteur.readAsDataURL(fichier);
    });
  }

  photo.addEventListener('change', async () => {
    A.effacerErreur(photo);
    const fichier = photo.files[0];
    if (!fichier) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(fichier.type)) {
      A.afficherErreur(photo, 'Format non accepté : choisissez une image JPG, PNG ou WebP.');
      photo.value = '';
      return;
    }
    if (fichier.size > 5 * 1024 * 1024) {
      A.afficherErreur(photo, 'Image trop lourde (5 Mo maximum).');
      photo.value = '';
      return;
    }
    try {
      photoDataUrl = await redimensionner(fichier);
      apercuImg.src = photoDataUrl;
      apercu.hidden = false;
      A.annoncer('Photo ajoutée. Aperçu affiché sous le champ.');
    } catch (e) {
      A.afficherErreur(photo, 'Impossible de lire cette image. Essayez un autre fichier.');
    }
  });

  $('retirer-photo').addEventListener('click', () => {
    photoDataUrl = '';
    photo.value = '';
    apercu.hidden = true;
    apercuImg.src = '';
    photo.focus();
    A.annoncer('Photo retirée.');
  });

  /* --- Envoi --- */
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nationale = estNationale();
    const regles = [
      { champ: titre, test: v => v.length >= 10, message: 'Le titre doit contenir au moins 10 caractères.' },
      { champ: description, test: v => v.length >= 80, message: `Décrivez davantage votre idée : 80 caractères minimum (actuellement ${description.value.trim().length}).` },
      { champ: $('theme'), test: v => v.length > 0, message: 'Choisissez un thème.' }
    ];
    if (!nationale) regles.push(
      { champ: $('region'), test: v => v.length > 0, message: 'Choisissez la région concernée.' },
      { champ: $('departement'), test: v => v.length > 0, message: 'Choisissez le département concerné.' }
    );
    const ok = A.valider(regles);
    if (!ok) return;

    const loi = {
      id: A.genererId('L'),
      titre: titre.value.trim(),
      theme: $('theme').value,
      portee: nationale ? 'nationale' : 'locale',
      region: nationale ? '' : $('region').value,
      departement: nationale ? '' : $('departement').value,
      description: description.value.trim(),
      descriptionOfficielle: '',
      photo: photoDataUrl,
      statut: 'soumise',
      auteurId: user.id,
      auteurPseudo: A.pseudo(user),
      dateCreation: new Date().toISOString(),
      pour: 0,
      contre: 0,
      reponseOfficielle: null,
      moderation: null,
      messages: []
    };

    if (!A.saveLoi(loi)) {
      A.afficherErreur(photo, 'Stockage du navigateur plein : retirez la photo puis réessayez.');
      photo.focus();
      return;
    }

    // Confirmation claire + suite du parcours
    const zone = $('zone-creation');
    zone.innerHTML = `
      <div class="carte">
        <div class="alerte alerte-succes" role="status">${A.icone('check')}
          <p><strong>Proposition envoyée !</strong> Elle a le statut ${A.badgeStatut('soumise')} : un modérateur va vérifier qu’elle respecte les règles avant de la publier.</p>
        </div>
        <h1 tabindex="-1" id="titre-confirmation">${A.esc(loi.titre)}</h1>
        <p class="aide">Vous pouvez suivre son statut et la justification de la modération dans « Mon compte ».</p>
        <div class="actions">
          <a class="btn btn-primaire" href="loi.html?id=${encodeURIComponent(loi.id)}">Voir ma proposition</a>
          <a class="btn btn-secondaire" href="compte.html#mes-propositions">Suivre mes propositions</a>
          <a class="btn btn-secondaire" href="accueil.html">Retour à l’accueil</a>
        </div>
      </div>`;
    $('titre-confirmation').focus();
  });
});
