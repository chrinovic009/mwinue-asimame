Thank you for using our template!

For more awesome templates please visit https://colorlib.com/wp/templates/

Copyright information for the template can't be altered/removed unless you purchase a license.
More information about the license is available here: https://colorlib.com/wp/licence/

Removing copyright information without the license will result in suspension of your hosting and/or domain name(s).

Actualités et commentaires sur Vercel
-------------------------------------

Les pages blog.html et blog-single.html chargent leurs données depuis les
fonctions Node.js du dossier api/. Les articles et les commentaires sont
enregistrés dans PostgreSQL via Neon. Chaque article a une adresse distincte
et ses propres commentaires et réponses. Le contenu d’un article accepte des
paragraphes séparés par une ligne vide et des intertitres commençant par « ## ».

Configuration initiale
-----------------------

1. Installer les dépendances avec npm install et relier le dépôt à Vercel avec
   npx vercel link.
2. Ajouter une base Neon PostgreSQL depuis le Marketplace Vercel, puis vérifier
   que DATABASE_URL est disponible pour les environnements Development,
   Preview et Production.
3. Créer un nouveau mot de passe administrateur (au moins 12 caractères) avec
   npm run hash-admin-password dans un terminal interactif. Saisir l’empreinte
   produite dans la variable secrète ADMIN_PASSWORD_HASH sur Vercel. Ne jamais
   saisir le mot de passe dans le code ou le dépôt.
4. Définir aussi ADMIN_USERNAME et SESSION_SECRET dans les variables
   d’environnement Vercel. Générer SESSION_SECRET avec :
   node -p "require('node:crypto').randomBytes(48).toString('base64url')"
5. Pour le développement, récupérer les variables avec
   npx vercel pull --environment=development, puis initialiser le schéma et
   les actualités de départ avec npm run migrate.
6. Dans chaque base de données Preview ou Production utilisée, exécuter
   npx vercel pull --environment=production puis
   node --env-file=.vercel/.env.production.local scripts/migrate.js.
7. Lancer le site local avec npx vercel dev (ne pas utiliser un serveur
   statique tel que « serve . », car il ne prend pas en charge les routes
   /api). Sur Vercel, un push Git déclenchera
   le déploiement après configuration des variables et initialisation de la
   base de données.

Le lien « Administration » en bas de blog.html et blog-single.html ouvre
admin.html. La session est signée et stockée dans un cookie HttpOnly protégé;
les mots de passe sont vérifiés avec scrypt. Les anciennes données de
commentaires conservées dans une base SQLite locale ne sont pas transférées
automatiquement vers Neon.
