/* =========================================================
   AGORA — js/api-config.js
   Adresse du serveur Python + SQLite (dossier serveur/ du dépôt).
   Laisser null : chaque navigateur garde ses propres données (démo locale).
   Pour partager les lois entre tous les visiteurs, indiquez l'adresse
   du serveur (voir serveur/README.md).
   ========================================================= */
'use strict';

window.AGORA_API = null;

// Exemples :
// window.AGORA_API = 'https://votre-pseudo.pythonanywhere.com';  // serveur en ligne
// window.AGORA_API = 'http://127.0.0.1:5050';                     // serveur lancé sur votre PC
