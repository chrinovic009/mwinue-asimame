Thank you for using our template!

For more awesome templates please visit https://colorlib.com/wp/templates/

Copyright information for the template can't be altered/removed unless you purchase a license.
More information about the license is available here: https://colorlib.com/wp/licence/

Removing copyright information without the license will result in suspension of your hosting and/or domain name(s).

Commentaires anonymes
---------------------

La page blog-single.html affiche le contenu sélectionné avec le paramètre
« article » dans l’adresse. En local, comments.php enregistre les commentaires
et les réponses dans une base SQLite. Sur Vercel, vercel.json redirige cette
route vers l’API Node api/comments.js, qui utilise PostgreSQL via Neon. La
variable d’environnement DATABASE_URL doit être configurée sur Vercel et la
base doit contenir les tables articles et comments. Si un article statique du
site n’existe pas encore dans la table articles, l’API ajoute ses métadonnées
avant d’enregistrer le premier commentaire.

Sur un autre hébergement, le serveur doit exécuter PHP avec PDO_SQLite activé et
autoriser PHP à écrire dans le dossier data/ (ou dans le dossier défini par la
variable d’environnement MWINUE_COMMENTS_DB).

Le dossier data/ est protégé par .htaccess sur Apache. Sur un hébergement Nginx
ou tout serveur qui n’applique pas les fichiers .htaccess, définissez
MWINUE_COMMENTS_DB vers un chemin situé hors de la racine publique du site.
La base de données est créée automatiquement à la première requête. Si elle
contient déjà des commentaires sans association à un article, ils sont conservés
et rattachés au bilan Octobre Rose 2026.
