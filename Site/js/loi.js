/* =========================================================
   AGORA — js/loi.js
   Fiche d'une proposition (loi.html?id=...), dans l'ordre :
   1. Titre  2. Description (officielle si rédigée)
   3. Avis favorable / défavorable  4. Débat
   + Réponse officielle et espace du responsable institutionnel.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer({ auth: true });
  if (!user) return;

  const A = AGORA;
  const id = new URLSearchParams(location.search).get('id');
  const zone = document.getElementById('fiche-loi');
  const dialog = document.getElementById('dialog-signalement');
  const formSignalement = document.getElementById('form-signalement');
  const erreurSignalement = document.getElementById('signalement-erreur');
  let messageASignaler = null;
  let boutonOrigineSignalement = null;

  /* ---------- Blocs de la fiche ---------- */

  function blocEntete(loi) {
    return `
      <nav class="fil-ariane" aria-label="Fil d’Ariane"><a href="accueil.html">${A.icone('retour')}Retour aux propositions</a></nav>
      <header class="carte entete-loi">
        <div class="meta-haut">
          ${A.badgeStatut(loi.statut)}
          <span class="etiquette">${A.esc(loi.theme)}</span>
          <span class="lieu">${A.icone('epingle')}${A.esc(A.lieu(loi))}</span>
        </div>
        <h1>${A.esc(loi.titre)}</h1>
        <p class="aide">Proposée par ${A.esc(loi.auteurPseudo)} le ${A.formatDate(loi.dateCreation)} · ${A.esc(A.STATUTS[loi.statut].aide)}</p>
        ${loi.photo ? `<img class="photo-loi" src="${loi.photo}" alt="Photo jointe par l’auteur pour illustrer la proposition « ${A.esc(loi.titre)} »">` : ''}
      </header>`;
  }

  function blocModeration(loi) {
    const m = loi.moderation;
    if (!m) {
      return loi.statut === 'soumise'
        ? `<div class="alerte alerte-info">${A.icone('info')}<p>Cette proposition attend la validation d’un modérateur. Elle n’est visible que par vous et par la modération.</p></div>`
        : '';
    }
    if (m.decision === 'refusee') {
      return `<div class="alerte alerte-erreur">${A.icone('alerte')}<div><p><strong>Proposition refusée par la modération</strong> le ${A.formatDate(m.date)}.</p><p>Justification : ${A.esc(m.justification)}</p></div></div>`;
    }
    if (m.decision === 'modifiee') {
      return `<p class="note-moderation">${A.icone('bouclier')}<span><strong>Modifiée par la modération</strong> le ${A.formatDate(m.date)}. Justification : ${A.esc(m.justification)}</span></p>`;
    }
    return '';
  }

  function blocDescription(loi) {
    const officielle = loi.descriptionOfficielle && loi.descriptionOfficielle.trim();
    return `
      <section class="carte" aria-labelledby="titre-description">
        <h2 id="titre-description">Description</h2>
        ${blocModeration(loi)}
        ${officielle
          ? `<p class="badge-officiel">${A.icone('agora')}Rédigée par le responsable institutionnel</p>
             <div class="texte-loi">${A.paragraphes(loi.descriptionOfficielle)}</div>
             <details><summary>Voir la proposition initiale de l’auteur</summary><div class="texte-loi">${A.paragraphes(loi.description)}</div></details>`
          : `<p class="badge-attente">${A.icone('crayon')}Texte de l’auteur · description officielle pas encore rédigée</p>
             <div class="texte-loi">${A.paragraphes(loi.description)}</div>`}
      </section>`;
  }

  function blocReponse(loi) {
    const r = loi.reponseOfficielle;
    if (!r) return '';
    return `
      <section class="carte reponse-officielle" aria-labelledby="titre-reponse">
        <p class="badge-officiel">${A.icone('check')}Réponse officielle</p>
        <h2 id="titre-reponse">Réponse de l’institution</h2>
        <div class="texte-loi">${A.paragraphes(r.texte)}</div>
        <p class="aide">${A.esc(r.auteur)} · ${A.formatDate(r.date)}</p>
      </section>`;
  }

  function blocInstitution(loi) {
    if (user.role !== 'institution') return '';
    if (!A.STATUTS_PUBLICS.includes(loi.statut)) {
      return `<section class="carte espace-institution"><h2>${A.icone('agora')} Espace institutionnel</h2>
        <p>Cette proposition doit d’abord être validée par la modération avant que vous puissiez y répondre.</p></section>`;
    }
    const r = loi.reponseOfficielle;
    return `
      <section class="carte espace-institution" aria-labelledby="titre-institution">
        <div class="entete-section">
          <h2 id="titre-institution">${A.icone('agora')} Espace institutionnel</h2>
          <button type="button" class="btn btn-secondaire" id="btn-modifier" aria-expanded="false" aria-controls="form-institution">${A.icone('crayon')}Modifier</button>
        </div>
        <p class="aide">Rédigez la description officielle, publiez une réponse et faites évoluer le statut. Vous voyez uniquement les totaux d’avis, jamais qui a donné quel avis.</p>
        <form id="form-institution" hidden novalidate>
          <div class="champ">
            <label for="desc-officielle">Description officielle <span class="facultatif">(facultatif)</span></label>
            <textarea id="desc-officielle" rows="6" aria-describedby="desc-officielle-aide">${A.esc(loi.descriptionOfficielle || '')}</textarea>
            <p id="desc-officielle-aide" class="aide">Reformulation neutre et précise de la proposition. Elle remplace le texte de l’auteur en haut de la fiche (le texte initial reste consultable).</p>
          </div>
          <div class="champ">
            <label for="reponse-officielle">Réponse officielle</label>
            <textarea id="reponse-officielle" rows="5" aria-describedby="reponse-aide">${A.esc(r ? r.texte : '')}</textarea>
            <p id="reponse-aide" class="aide">Affichée en évidence avec le badge « Réponse officielle ». Obligatoire pour clôturer.</p>
          </div>
          <div class="champ">
            <label for="nouveau-statut">Statut</label>
            <select id="nouveau-statut">
              ${A.STATUTS_PUBLICS.map(s => `<option value="${s}" ${s === loi.statut ? 'selected' : ''}>${A.STATUTS[s].label} — ${A.STATUTS[s].aide}</option>`).join('')}
            </select>
          </div>
          <div class="actions">
            <button type="submit" class="btn btn-primaire">${A.icone('check')}Enregistrer</button>
            <button type="button" class="btn btn-secondaire" id="annuler-institution">Annuler</button>
          </div>
        </form>
      </section>`;
  }

  function blocAvis(loi) {
    const p = A.pourcentages(loi);
    const monAvis = A.getAvis(user.id, loi.id);
    const ouvert = loi.statut === 'en-discussion';
    const libelleMonAvis = monAvis === 'pour' ? 'favorable' : 'défavorable';
    return `
      <section class="carte" aria-labelledby="titre-avis">
        <h2 id="titre-avis">Avis des participants</h2>
        <p class="note-consultatif">${A.icone('info')}<span><strong>Avis consultatif :</strong> il indique si l’idée vous plaît ou non. Ce n’est pas un vote officiel et le résultat ne vaut pas décision.</span></p>
        <div class="boutons-avis" role="group" aria-label="Donner mon avis">
          <button type="button" class="btn-avis favorable" data-avis="pour" aria-pressed="${monAvis === 'pour'}" ${ouvert ? '' : 'disabled'}>
            ${A.icone('pouceHaut')}<span>Favorable</span><span class="compteur">${A.formatNombre(loi.pour)}<span class="sr-only"> avis favorables</span></span>
          </button>
          <button type="button" class="btn-avis defavorable" data-avis="contre" aria-pressed="${monAvis === 'contre'}" ${ouvert ? '' : 'disabled'}>
            ${A.icone('pouceBas')}<span>Défavorable</span><span class="compteur">${A.formatNombre(loi.contre)}<span class="sr-only"> avis défavorables</span></span>
          </button>
        </div>
        <div class="barre-avis barre-avis-grande" aria-hidden="true">
          <span class="part-pour" style="width:${p.pour}%"></span><span class="part-contre" style="width:${p.contre}%"></span>
        </div>
        <p class="resultat-avis"><strong>${p.pour} % favorables</strong> · ${p.contre} % défavorables · sur <strong>${A.formatNombre(p.total)} participants</strong></p>
        <p class="aide">Ces chiffres reflètent uniquement les personnes qui ont participé : ils ne sont pas représentatifs de l’ensemble de la population. Un seul avis par compte.</p>
        ${monAvis ? `<p>Votre avis : <strong>${libelleMonAvis}</strong>. Cliquez sur l’autre bouton pour le changer, ou à nouveau sur le même pour le retirer.</p>` : ''}
        ${ouvert ? '' : `<p class="alerte alerte-info">${A.icone('cadenas')}<span>Les avis sont fermés : statut « ${A.STATUTS[loi.statut].label} ».</span></p>`}
      </section>`;
  }

  function itemMessage(m, loi) {
    if (m.moderation && m.moderation.decision === 'masque') {
      return `<li class="message message-masque">${A.icone('bouclier')} Message masqué par la modération. Justification : ${A.esc(m.moderation.justification)}</li>`;
    }
    const estMoi = m.auteurId === user.id;
    let action = '';
    if (estMoi) action = '<span class="aide">Votre message</span>';
    else if (m.signalement && !m.moderation) action = `<span class="etiquette">${A.icone('drapeau')}Signalé · en attente de modération</span>`;
    else if (m.moderation && m.moderation.decision === 'conserve') action = `<span class="etiquette">${A.icone('check')}Vérifié par la modération</span>`;
    else if (debatOuvert(loi)) action = `<button type="button" class="btn btn-discret" data-signaler="${A.esc(m.id)}">${A.icone('drapeau')}Signaler<span class="sr-only"> le message de ${A.esc(m.auteur)}</span></button>`;

    return `
      <li class="message ${estMoi ? 'message-moi' : ''}">
        <div class="message-entete"><strong>${A.esc(m.auteur)}</strong><time datetime="${A.esc(m.date)}">${A.formatDate(m.date, true)}</time></div>
        <p>${A.esc(m.texte)}</p>
        <div class="message-actions">${action}</div>
      </li>`;
  }

  const debatOuvert = loi => loi.statut === 'en-discussion' || loi.statut === 'examinee';

  function blocDebat(loi) {
    const nb = loi.messages.length;
    return `
      <section class="carte" aria-labelledby="titre-debat">
        <h2 id="titre-debat" tabindex="-1">${A.icone('bulle')} Débat <span class="aide">(${nb} message${nb > 1 ? 's' : ''})</span></h2>
        ${nb ? `<ul class="liste-messages">${loi.messages.map(m => itemMessage(m, loi)).join('')}</ul>`
             : '<p class="vide">Aucun message pour l’instant. Lancez le débat !</p>'}
        ${debatOuvert(loi) ? `
          <form id="form-message" novalidate>
            <div class="champ">
              <label for="message-texte">Votre message</label>
              <textarea id="message-texte" rows="3" maxlength="500" aria-describedby="message-aide message-compteur"></textarea>
              <p id="message-compteur" class="compteur-car" aria-live="polite">0 / 500</p>
              <p id="message-aide" class="aide">Argumentez avec respect. Les messages injurieux ou hors sujet peuvent être masqués selon les <a href="regles.html">règles de modération</a>.</p>
            </div>
            <button type="submit" class="btn btn-primaire">${A.icone('bulle')}Publier</button>
          </form>`
          : `<p class="alerte alerte-info">${A.icone('cadenas')}<span>Le débat est fermé pour cette proposition.</span></p>`}
      </section>`;
  }

  /* ---------- Affichage complet ---------- */
  function rendre(focusSelecteur) {
    const loi = A.getLoi(id);
    if (!loi) {
      zone.innerHTML = `<div class="carte vide"><h1>Proposition introuvable</h1><p>Le lien est peut-être incorrect.</p><a class="btn btn-primaire" href="accueil.html">Retour aux propositions</a></div>`;
      return;
    }
    const estAuteur = loi.auteurId === user.id;
    const estModo = user.role === 'moderateur';
    if (!A.STATUTS_PUBLICS.includes(loi.statut) && !estAuteur && !estModo) {
      zone.innerHTML = `<div class="carte vide"><h1>Proposition non publique</h1><p>Cette proposition n’a pas (encore) été validée par la modération.</p><a class="btn btn-primaire" href="accueil.html">Retour aux propositions</a></div>`;
      return;
    }

    document.title = `${loi.titre} — AGORA`;
    // Ordre imposé : titre, description, (réponse officielle), avis, débat
    zone.innerHTML = [
      blocEntete(loi),
      blocDescription(loi),
      blocReponse(loi),
      blocInstitution(loi),
      A.STATUTS_PUBLICS.includes(loi.statut) ? blocAvis(loi) : '',
      A.STATUTS_PUBLICS.includes(loi.statut) ? blocDebat(loi) : ''
    ].join('');
    brancher(loi);

    if (focusSelecteur) {
      const el = zone.querySelector(focusSelecteur);
      if (el) el.focus();
    }
  }

  /* ---------- Interactions ---------- */
  function brancher(loi) {
    // Avis favorable / défavorable
    zone.querySelectorAll('.btn-avis').forEach(bouton => {
      bouton.addEventListener('click', () => {
        const valeur = bouton.dataset.avis;
        const resultat = A.donnerAvis(user.id, loi.id, valeur);
        rendre(`.btn-avis[data-avis="${valeur}"]`);
        A.annoncer(resultat
          ? `Avis ${resultat === 'pour' ? 'favorable' : 'défavorable'} enregistré (consultatif).`
          : 'Votre avis a été retiré.');
      });
    });

    // Nouveau message
    const formMessage = zone.querySelector('#form-message');
    if (formMessage) {
      const texte = formMessage.querySelector('#message-texte');
      const compteur = formMessage.querySelector('#message-compteur');
      texte.addEventListener('input', () => { compteur.textContent = `${texte.value.length} / 500`; });
      formMessage.addEventListener('submit', e => {
        e.preventDefault();
        const ok = A.valider([
          { champ: texte, test: v => v.length > 0, message: 'Écrivez un message avant de publier.' },
          { champ: texte, test: v => v.length >= 10, message: 'Message trop court : 10 caractères minimum pour argumenter.' }
        ]);
        if (!ok) return;
        const loiAJour = A.getLoi(loi.id);
        loiAJour.messages.push({
          id: A.genererId('M'),
          auteurId: user.id,
          auteur: A.pseudo(user),
          date: new Date().toISOString(),
          texte: texte.value.trim(),
          signalement: null,
          moderation: null
        });
        A.saveLoi(loiAJour);
        rendre('#message-texte');
        A.annoncer('Message publié.');
      });
    }

    // Ouverture de la fenêtre de signalement
    zone.querySelectorAll('[data-signaler]').forEach(bouton => {
      bouton.addEventListener('click', () => {
        messageASignaler = bouton.dataset.signaler;
        boutonOrigineSignalement = bouton;
        formSignalement.reset();
        erreurSignalement.hidden = true;
        dialog.showModal();
        const premier = dialog.querySelector('input[type="radio"]');
        if (premier) premier.focus();
      });
    });

    // Espace institutionnel
    const btnModifier = zone.querySelector('#btn-modifier');
    const formInstitution = zone.querySelector('#form-institution');
    if (btnModifier && formInstitution) {
      const basculer = ouvrir => {
        formInstitution.hidden = !ouvrir;
        btnModifier.setAttribute('aria-expanded', String(ouvrir));
        if (ouvrir) formInstitution.querySelector('#desc-officielle').focus();
        else btnModifier.focus();
      };
      btnModifier.addEventListener('click', () => basculer(formInstitution.hidden));
      zone.querySelector('#annuler-institution').addEventListener('click', () => basculer(false));

      formInstitution.addEventListener('submit', e => {
        e.preventDefault();
        const desc = formInstitution.querySelector('#desc-officielle');
        const reponse = formInstitution.querySelector('#reponse-officielle');
        const statut = formInstitution.querySelector('#nouveau-statut');
        const ok = A.valider([
          { champ: reponse, test: v => statut.value !== 'cloturee' || v.length >= 20, message: 'Pour clôturer, rédigez une réponse officielle (20 caractères minimum) : le citoyen doit savoir ce que devient sa proposition.' }
        ]);
        if (!ok) return;

        const loiAJour = A.getLoi(loi.id);
        const ancienStatut = loiAJour.statut;
        loiAJour.descriptionOfficielle = desc.value.trim();
        const texteReponse = reponse.value.trim();
        if (!texteReponse) loiAJour.reponseOfficielle = null;
        else if (!loiAJour.reponseOfficielle || loiAJour.reponseOfficielle.texte !== texteReponse) {
          loiAJour.reponseOfficielle = {
            texte: texteReponse,
            auteur: `${A.pseudo(user)}, responsable institutionnel·le`,
            date: new Date().toISOString()
          };
        }
        loiAJour.statut = statut.value;
        A.saveLoi(loiAJour);
        if (ancienStatut !== statut.value) {
          A.ajouterJournal({
            type: 'Statut',
            cible: loiAJour.titre,
            decision: `${A.STATUTS[ancienStatut].label} → ${A.STATUTS[statut.value].label}`,
            justification: texteReponse ? 'Réponse officielle publiée sur la fiche.' : 'Changement de statut par l’institution.'
          });
        }
        rendre('#btn-modifier');
        A.annoncer('Modifications enregistrées et visibles par tous.');
      });
    }
  }

  /* ---------- Fenêtre de signalement ---------- */
  document.getElementById('motifs').innerHTML = A.MOTIFS_SIGNALEMENT.map((motif, i) => `
    <div class="choix">
      <input type="radio" name="motif" id="motif-${i}" value="${A.esc(motif)}">
      <label for="motif-${i}">${A.esc(motif)}</label>
    </div>`).join('');

  // À la fermeture (Annuler ou touche Échap), le focus revient sur le bouton « Signaler »
  dialog.addEventListener('close', () => {
    if (boutonOrigineSignalement && document.body.contains(boutonOrigineSignalement)) boutonOrigineSignalement.focus();
  });
  document.getElementById('annuler-signalement').addEventListener('click', () => dialog.close());

  formSignalement.addEventListener('submit', e => {
    e.preventDefault();
    const choisi = formSignalement.querySelector('input[name="motif"]:checked');
    if (!choisi) {
      erreurSignalement.innerHTML = `${A.icone('alerte')}<span>Choisissez un motif de signalement.</span>`;
      erreurSignalement.hidden = false;
      formSignalement.querySelector('input[name="motif"]').focus();
      return;
    }
    const loi = A.getLoi(id);
    const message = loi.messages.find(m => m.id === messageASignaler);
    if (message) {
      message.signalement = { motif: choisi.value, date: new Date().toISOString(), par: user.id };
      A.saveLoi(loi);
    }
    boutonOrigineSignalement = null;
    dialog.close();
    rendre('#titre-debat');
    A.annoncer('Signalement envoyé. Un modérateur va examiner ce message.');
  });

  rendre();
});
