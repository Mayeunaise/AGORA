# Voici le readme

A qui ça correspond : Tout les citoyens français majeur 
situation fictive : 
Citoyens : personne majeur qui veut donner son avis, faire des demandes de lois, débat sur les lois proposées par les autres citoyens
Modérateur : vérification des rôles, vérification des loi proposée, gestion du site, choix de la bonne catégorie de la loi    
Responsable institutionnel : Reçoit les résultats des votes dès que ces derniers sont terminés ; apporte des précisions sur n’importe quels sujets, ces précisions sont mises en avant.
Personnas
Citoyen : 
Objectifs : proposer des projet de loi, débattre avec d’autre citoyens et voter pour ou contre les proposition de loi 
Contexte : posséder un moyens de se connecter à internet 
Contraintes : création de compte, fuite de donnée 
Motivations et frustrations : débattre avec d’autres citoyens  
Scénario : utilisation simple du site internet 

	

Modérateur
Objectifs : Garder un site modéré (débat, proposition) , agréable pour les utilisateur, gérer les rôles 
Contexte : Rôle modérateur du site, gestion de base de données, ordinateur, téléphone (web) 
Contraintes : accès à internet, impartialité ( ne pas supprimer des débat parce qu’il sont contraire à ces idées), Savoir quoi supprimer
Motivations et frustrations : Utilité dans les débat public
Scénario : examiner un signalement et modérer une contribution



Responsable institutionnel : 
Objectifs : Récupérer les résultats
Contexte : Possède un ordinateur et téléphone, compétence informatique limitée
Contraintes :  compétence informatique limitée, consultation sur téléphone et ordinateur
Motivations et frustrations : Avoir des nouvelles idées de loi 
Scénario : Recevoir les données
	

Remodeler le sujet: 





Plan projet AGORA (3 personnes, 5 séances)
Le piège à éviter : la note récompense la compréhension des besoins, pas une belle interface générée par IA. Chaque choix doit pouvoir se justifier à l’oral.
Répartition conseillée
A, UX & doc : note de cadrage, personas, parcours, tests, support d’oral
B, Front citoyen : explorer, fiche proposition, vote, dépôt
C, Front modérateur + institutionnel + qualité : espace modérateur, tableau institutionnel, statuts, données JSON, accessibilité/responsive (A peut prendre la fiche d’examen si C est surchargé)
Tout le monde participe aux tests et à l’oral (la répartition de la parole est notée).
Avant S2 (à faire maintenant)
Créer un repo GitHub et un doc partagé
Choisir la stack : HTML/CSS/JS vanilla + JSON + localStorage, hébergé sur GitHub Pages (une URL dispo = maquette “lançable sans le groupe” ✅)
Chacun lit le sujet 6 et note 3 frustrations réelles sur la participation citoyenne (pétitions, consultations publiques…)
Bonus solide : 3 à 5 mini-entretiens de 5 min avec des proches, pour que les personas soient “fondés sur des indices”
S2 — Cadrage (livrables 1 et 2)
Note de cadrage (1–2 pages)
Problème : les citoyens ne savent pas comment proposer ni si leur avis compte
Cible, proposition de valeur, périmètre, hypothèses
Hors périmètre : vrai vote, authentification réelle, API
Les 3 personas
Citoyen : ex. 35 ans, sur mobile, méfiant, veut savoir si son avis sert à quelque chose
Modérateur : charge de travail élevée, a besoin de règles claires
Responsable institutionnel : Claire, 48 ans, chargée de mission dans un ministère fictif
Objectif : repérer vite les propositions à examiner et rendre compte de la suite donnée
Contexte : sur ordinateur, peu de temps, obligation de neutralité
Frustration : chiffres bruts sans contexte, peur des votes manipulés
Attente : synthèse fiable et moyen simple de répondre aux citoyens
Parcours détaillés (étape → action → émotion → obstacle → donnée)
Citoyen : découvrir → déposer une proposition → voter sur une autre
Modérateur : recevoir un signalement → examiner → décider et motiver
Responsable institutionnel (bonus au-delà des 2 exigés) : tableau de bord → filtrer les propositions au-dessus d’un seuil (ex. 500 votes) → ouvrir une fiche d’examen → passer en “examinée” puis “clôturée” → rédiger une réponse officielle → le citoyen auteur la voit dans “Mes contributions”
Ce 3e parcours boucle la boucle : le citoyen voit que son avis a été lu, ce qui répond directement au problème de départ.
Ensuite : arborescence et wireframes papier ou Figma.
Les vues à prévoir
Accueil / Explorer : filtres par thème, tri par popularité ou date, recherche
Fiche proposition : contexte, texte, impact, statut, arguments pour/contre, vote, bouton signaler, réponse officielle si clôturée
Déposer une proposition : formulaire en étapes (titre, contexte, texte, thème, impact) avec aperçu
Confirmation + Mes contributions : suivi du statut et réponse institutionnelle
File de modération : signalements triés par gravité
Détail signalement : contenu, motif, actions (valider / masquer / demander une modif), justification obligatoire
Tableau institutionnel : compteurs par statut, top propositions par thème, filtres (thème, seuil de votes, date), graphique simple doublé d’un tableau pour l’accessibilité
Fiche d’examen : résultat pour/contre avec le nombre de votants, synthèse des 3 meilleurs arguments de chaque côté, indicateur de fiabilité (pic de votes suspect, part de comptes récents), historique de modération, sélecteur de statut et champ “Réponse officielle”
Règles & transparence : fonctionnement des votes, de la modération, et limites
Ça fait 9 vues, un poil au-dessus de la fourchette de 5 à 8. Si vous manquez de temps, fusionnez la 9 dans un pied de page ou une modale.
Un sélecteur de rôle en haut (citoyen / modérateur / institution) sert pour la démo, annoncé comme simulé.
Actions métier simulées (il en faut 2, vise 5)
Déposer une proposition, avec validation et erreurs précises
Voter pour ou contre, avec compteur à jour et un seul vote possible
Signaler un argument
Modérer un contenu, avec le motif visible publiquement
Clôturer une proposition avec réponse officielle : le champ est obligatoire (erreur claire s’il est vide), le statut se met à jour partout (explorer, fiche, mes contributions), et la réponse est enregistrée en localStorage
Points éthiques à rendre visibles (gros levier de note)
Bandeau permanent : “Vote consultatif et simulé, pas un scrutin officiel”
Afficher le nombre de votants à côté des %, avec la mention “non représentatif de la population”
Anti-manipulation : 1 vote par compte, mention de la détection de votes massifs, alertes de fiabilité côté institution (signalement sans blocage automatique)
Protection des opinions : votes individuels jamais publics, pseudonymes. Le responsable institutionnel ne voit que des agrégats, jamais qui a voté quoi
Modération transparente : règles publiques, motif affiché, recours possible
Statuts clairs : soumise → en discussion → examinée → clôturée, avec la mention “Résultat consultatif, ne constitue pas une décision”
Réponse officielle publique : c’est un gage de transparence qui limite les décisions opaques
S3 — Prototype V1
C fait le JSON fictif (environ 15 propositions et 5 signalements) ainsi que la structure et la navigation
B fait les parcours citoyen
C fait les parcours modérateur et institutionnel, avec un composant tableau/statut commun aux deux
A rédige les scénarios de test, vérifie la cohérence avec les parcours, et peut prendre la fiche d’examen
Objectif fin de séance : les parcours fonctionnent de bout en bout
S4 — Tests et corrections (livrable 4)
Protocole : 3 à 5 personnes extérieures, une tâche sans explication (ex. “proposez une idée sur le thème Environnement puis votez contre une autre”, ou “clôturez la proposition la plus votée en y répondant”), l’observateur ne guide pas
Noter : réussite, temps, hésitations, verbatims
Retenir 2 corrections justifiées (ex. “3 testeurs sur 4 n’ont pas compris que le vote était définitif, donc ajout d’une confirmation”)
Checklist accessibilité : navigation au Tab, focus visible, labels sur les champs, contrastes, information jamais portée par la couleur seule (pour/contre = couleur et icône ou texte), affichage mobile
Préparer l’oral et le répéter une fois en chronométrant
S5 — Soutenance (15 min + 5 min de questions)
2–3 min : problème et personas
6–7 min : démo des parcours en direct (citoyen → modérateur → institution, ce qui raconte une histoire complète)
3 min : tests et corrections
2 min : limites éthiques et techniques, usage de l’IA, prochaine amélioration
Préparer une réponse aux 5 questions types du cahier des charges, surtout “qu’avez-vous changé après les tests ?”
Usage de l’IA
Il est autorisé mais doit être déclaré. Notez au fur et à mesure quel outil a servi à quoi et ce que vous avez dû corriger, c’est attendu à l’oral.


