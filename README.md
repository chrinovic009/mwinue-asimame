# Mwinue Asimame — site + administration

Site statique (HTML/CSS/JS) + API serverless Vercel (Node.js, **aucune dépendance npm**) + base de données **Supabase** (PostgreSQL + stockage d'images) + dons **Mobile Money** (Orange Money, M-Pesa, Airtel Money) via l'agrégateur congolais **FlexPay**.

## Ce qui est géré depuis `/admin`

| Onglet | Contenu |
|---|---|
| Tableau de bord | chiffres clés, temps d'existence en direct, vues, j'aime, commentaires, dons, graphiques d'impact et de dons |
| Page d'accueil | section « Dernière activité » (texte, image, badge, points clés, bouton) — remplissable depuis une réalisation |
| Réalisations / Actualités | création, modification, images, paragraphes, temps forts, étapes, FAQ, brouillon/publication, mise en avant, vues et j'aime |
| Galerie / Médiathèque | photos avec leurs détails, téléversement (compression automatique), suppression |
| Équipe / Partenaires / Témoignages | ajout, ordre, publication |
| Impact | indicateurs (valeur / objectif) → pourcentage et graphique calculés automatiquement |
| Commentaires | modération, réponse au nom de l'association, suppression |
| Messages / Abonnés | formulaire de contact, newsletter, export CSV |
| Dons & paiements | suivi des transactions, revérification opérateur, export CSV |
| Coordonnées & paramètres | téléphones, e-mail, adresse physique, carte, réseaux sociaux, date de création, modération, montants de don, verrouillage auto |
| Utilisateurs | administrateurs et **communicateurs** avec autorisations à cocher (sans « Publier », leurs contenus restent en brouillon) |
| Journal | historique de toutes les actions |

**Verrouillage façon téléphone** : bouton cadenas (ou Ctrl+Maj+L), verrouillage automatique après inactivité, déverrouillage par code PIN sur un clavier numérique. 5 PIN erronés ferment toutes les sessions. Chaque nouvel onglet ou réouverture du navigateur démarre verrouillé.

## Mise en ligne sur Vercel

1. **Base de données** : déjà créée (projet Supabase « MWAS - Mwinue Asimame », tables et contenu actuel importés). Pour une autre base : exécuter `supabase/schema.sql` puis `supabase/seed.sql` dans l'éditeur SQL Supabase.
2. Dans Supabase → *Project Settings → API Keys*, copier la clé **service_role** (secrète).
3. Dans Vercel → *Settings → Environment Variables*, ajouter les variables de `.env.example` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` = clé **secrète**, `AUTH_SECRET`, puis `FLEXPAY_TOKEN` et `FLEXPAY_MERCHANT`).
4. Déployer (git push ou `vercel --prod`). Framework : **Other**, pas de commande de build.
5. Ouvrir `https://<votre-site>/admin/` et se connecter avec les identifiants de première connexion (`contact@mwas.org` / `MWAS_FIRSTLOGIN@2026`). L’administration oblige alors à choisir une nouvelle adresse e-mail, un nouveau mot de passe et un code PIN ; les identifiants par défaut cessent ensuite de fonctionner (ils ne marchent que tant qu’aucun compte n’existe).

## Paiements

Le donateur choisit le montant (FC ou USD), le réseau et son numéro ; FlexPay envoie la demande sur son téléphone, il confirme avec **son** code (jamais saisi sur le site). Le statut est confirmé par le rappel FlexPay (URL signée) **et** revérifié auprès de FlexPay. Tant que `FLEXPAY_TOKEN`/`FLEXPAY_MERCHANT` ne sont pas définis, la page de don l'indique et n'encaisse rien. Contrat marchand : https://flexpay.cd

## Lancer sur son ordinateur

Copier `.env.example` en `.env`, le remplir, puis `npm start` et ouvrir http://localhost:3000/admin/.

## Tests locaux

`node tools/mock-test.js` — 60+ vérifications de l'API sur une base simulée.
