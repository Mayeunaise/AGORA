/* =========================================================
   AGORA — js/moderation-lois.js
   Interface « Alertes » du modérateur :
   - propositions soumises : accepter, modifier puis accepter, refuser
   - messages signalés : conserver ou masquer
   Toute décision exige une justification, rendue publique.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer({ auth: true, moderation: true });
  if (!user) return;

  const A = AGORA;
  const $ = id => document.getElementById(id);
  const MIN_JUSTIF = 10;

  /* ---------- Propositions soumises ---------- */
  function elementLoi(loi) {
    const i = A.esc(loi.id);
    return `
      <article class="carte element-moderation" aria-labelledby="titre-${i}">
        <div class="carte-loi-meta">${A.badgeStatut(loi.statut)}<span class="etiquette">${A.esc(loi.theme)}</span>
          <span class="lieu">${A.icone('epingle')}${A.esc(loi.region)} · ${A.esc(loi.departement)}</span></div>
        <h3 id="titre-${i}">${A.esc(loi.titre)}</h3>
        <p class="aide">Proposée par ${A.esc(loi.auteurPseudo)} le ${A.formatDate(loi.dateCreation, true)}</p>
        ${loi.photo ? `<img class="photo-loi" src="${loi.photo}" alt="Photo jointe à la proposition « ${A.esc(loi.titre)} »">` : ''}
        <div class="citation texte-loi">${A.paragraphes(loi.description)}</div>

        <form data-loi="${i}" novalidate>
          <div id="modif-${i}" hidden>
            <p class="alerte alerte-info">${A.icone('crayon')}<span>Corrigez uniquement la forme (titre neutre, orthographe, propos déplacés). Le fond de l’idée doit rester celui de l’auteur.</span></p>
            <div class="champ">
              <label for="titre-modif-${i}">Titre corrigé</label>
              <input type="text" id="titre-modif-${i}" maxlength="120" value="${A.esc(loi.titre)}">
            </div>
            <div class="champ">
              <label for="desc-modif-${i}">Description corrigée</label>
              <textarea id="desc-modif-${i}" rows="5">${A.esc(loi.description)}</textarea>
            </div>
          </div>
          <div class="champ">
            <label for="justif-${i}">Justification de la décision <span class="obligatoire" aria-hidden="true">*</span></label>
            <textarea id="justif-${i}" rows="3" aria-describedby="justif-aide-${i}"></textarea>
            <p id="justif-aide-${i}" class="aide">Affichée publiquement. Exemple : « Conforme aux règles » ou « Titre reformulé pour rester neutre ».</p>
          </div>
          <div class="actions">
            <button type="submit" value="acceptee" class="btn btn-succes" data-bouton-accepter>${A.icone('check')}<span>Accepter</span></button>
            <button type="button" class="btn btn-secondaire" data-modifier aria-expanded="false" aria-controls="modif-${i}">${A.icone('crayon')}Modifier</button>
            <button type="submit" value="refusee" class="btn btn-danger">${A.icone('croix')}Refuser</button>
          </div>
        </form>
      </article>`;
  }

  /* ---------- Messages signalés ---------- */
  function elementMessage(loi, m) {
    const i = A.esc(m.id);
    return `
      <article class="carte element-moderation" aria-labelledby="titre-msg-${i}">
        <div class="carte-loi-meta"><span class="etiquette">${A.icone('drapeau')}Motif : ${A.esc(m.signalement.motif)}</span>
          <span class="aide">signalé le ${A.formatDate(m.signalement.date, true)}</span></div>
        <h3 id="titre-msg-${i}">Message de ${A.esc(m.auteur)}</h3>
        <p class="aide">Dans le débat : <a href="loi.html?id=${encodeURIComponent(loi.id)}">${A.esc(loi.titre)}</a> · publié le ${A.formatDate(m.date, true)}</p>
        <blockquote class="citation">${A.esc(m.texte)}</blockquote>
        <form data-message="${i}" data-loi-du-message="${A.esc(loi.id)}" novalidate>
          <div class="champ">
            <label for="justif-${i}">Justification de la décision <span class="obligatoire" aria-hidden="true">*</span></label>
            <textarea id="justif-${i}" rows="3" aria-describedby="justif-aide-${i}"></textarea>
            <p id="justif-aide-${i}" class="aide">Si le message est masqué, cette justification remplace son contenu dans le débat.</p>
          </div>
          <div class="actions">
            <button type="submit" value="conserve" class="btn btn-succes">${A.icone('check')}Conserver le message</button>
            <button type="submit" value="masque" class="btn btn-danger">${A.icone('oeil')}Masquer le message</button>
          </div>
        </form>
      </article>`;
  }

  /* ---------- Affichage ---------- */
  function afficher() {
    const lois = A.getLois();
    const soumises = lois.filter(l => l.statut === 'soumise')
      .sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation)); // les plus anciennes d'abord
    const signales = [];
    lois.forEach(l => l.messages.forEach(m => { if (m.signalement && !m.moderation) signales.push([l, m]); }));

    $('nb-lois').textContent = `(${soumises.length} en attente)`;
    $('nb-messages').textContent = `(${signales.length} en attente)`;
    $('liste-lois-soumises').innerHTML = soumises.length
      ? soumises.map(elementLoi).join('')
      : `<p class="carte vide">${A.icone('check')} Aucune proposition en attente.</p>`;
    $('liste-messages-signales').innerHTML = signales.length
      ? signales.map(([l, m]) => elementMessage(l, m)).join('')
      : `<p class="carte vide">${A.icone('check')} Aucun message signalé.</p>`;

    A.renderHeader(user); // met à jour le badge « Alertes »
  }

  /* ---------- Bouton « Modifier » : affiche les champs d'édition ---------- */
  document.addEventListener('click', e => {
    const bouton = e.target.closest('[data-modifier]');
    if (!bouton) return;
    const form = bouton.closest('form');
    const bloc = form.querySelector(`#${CSS.escape(bouton.getAttribute('aria-controls'))}`);
    const ouvrir = bloc.hidden;
    bloc.hidden = !ouvrir;
    bouton.setAttribute('aria-expanded', String(ouvrir));
    form.querySelector('[data-bouton-accepter] span').textContent = ouvrir ? 'Enregistrer les modifications et accepter' : 'Accepter';
    if (ouvrir) bloc.querySelector('input').focus();
  });

  /* ---------- Décisions ---------- */
  document.addEventListener('submit', e => {
    const form = e.target;
    if (!form.dataset.loi && !form.dataset.message) return;
    e.preventDefault();
    const decisionDemandee = e.submitter ? e.submitter.value : '';
    const idCible = form.dataset.loi || form.dataset.message;
    const justif = form.querySelector(`#justif-${CSS.escape(idCible)}`);

    const regles = [{ champ: justif, test: v => v.length >= MIN_JUSTIF, message: `La justification est obligatoire (${MIN_JUSTIF} caractères minimum) : elle sera affichée publiquement.` }];

    /* --- Décision sur une proposition --- */
    if (form.dataset.loi) {
      const loi = A.getLoi(idCible);
      const blocModif = form.querySelector(`#modif-${CSS.escape(idCible)}`);
      const titreModif = form.querySelector(`#titre-modif-${CSS.escape(idCible)}`);
      const descModif = form.querySelector(`#desc-modif-${CSS.escape(idCible)}`);
      const modifie = decisionDemandee === 'acceptee' && !blocModif.hidden &&
        (titreModif.value.trim() !== loi.titre || descModif.value.trim() !== loi.description);
      if (modifie) {
        regles.push(
          { champ: titreModif, test: v => v.length >= 10, message: 'Le titre doit contenir au moins 10 caractères.' },
          { champ: descModif, test: v => v.length >= 20, message: 'La description est trop courte.' }
        );
      }
      if (!A.valider(regles)) return;

      const decision = decisionDemandee === 'refusee' ? 'refusee' : (modifie ? 'modifiee' : 'acceptee');
      if (modifie) {
        loi.titre = titreModif.value.trim();
        loi.description = descModif.value.trim();
      }
      loi.statut = decision === 'refusee' ? 'refusee' : 'en-discussion';
      loi.moderation = { decision, justification: justif.value.trim(), date: new Date().toISOString(), moderateur: A.pseudo(user) };
      A.saveLoi(loi);
      A.ajouterJournal({ type: 'Proposition', cible: loi.titre, decision: A.libelleDecision(decision), justification: justif.value.trim() });
      afficher();
      $('titre-lois').focus();
      A.annoncer(`Proposition ${decision === 'refusee' ? 'refusée' : 'publiée'}. L’auteur voit votre justification.`);
      return;
    }

    /* --- Décision sur un message signalé --- */
    if (!A.valider(regles)) return;
    const loi = A.getLoi(form.dataset.loiDuMessage);
    const message = loi.messages.find(m => m.id === idCible);
    message.moderation = { decision: decisionDemandee, justification: justif.value.trim(), date: new Date().toISOString(), moderateur: A.pseudo(user) };
    A.saveLoi(loi);
    A.ajouterJournal({ type: 'Message', cible: `Message de ${message.auteur} (« ${loi.titre} »)`, decision: A.libelleDecision(decisionDemandee), justification: justif.value.trim() });
    afficher();
    $('titre-messages').focus();
    A.annoncer(decisionDemandee === 'masque' ? 'Message masqué avec votre justification.' : 'Message conservé.');
  });

  afficher();
});
