/* =========================================================
   AGORA — js/regles.js
   Page « Règles et transparence » : accessible sans compte,
   affiche le journal public des décisions de modération.
   ========================================================= */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AGORA.demarrer();
  if (!user) return;

  const A = AGORA;
  const journal = A.getJournal();
  const zone = document.getElementById('journal-contenu');

  zone.innerHTML = journal.length
    ? `<div class="tableau-wrap">
        <table>
          <caption class="sr-only">Journal public des décisions de modération</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Type</th><th scope="col">Concerne</th><th scope="col">Décision</th><th scope="col">Justification</th></tr></thead>
          <tbody>${journal.map(j => `
            <tr>
              <td>${A.formatDate(j.date)}</td>
              <td>${A.esc(j.type)}</td>
              <td>${A.esc(j.cible)}</td>
              <td>${A.esc(j.decision)}</td>
              <td>${A.esc(j.justification)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`
    : '<p class="vide">Aucune décision pour le moment.</p>';
});
