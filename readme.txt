Thank you for using our template!

For more awesome templates please visit https://colorlib.com/wp/templates/

Copyright information for the template can't be altered/removed unless you purchase a license.
More information about the license is available here: https://colorlib.com/wp/licence/

Removing copyright information without the license will result in suspension of your hosting and/or domain name(s).

Commentaires anonymes
---------------------

La page blog-single.html affiche le contenu sélectionné avec le paramètre
« article » dans l’adresse. Les commentaires et les réponses sont enregistrés
séparément pour chaque actualité par comments.php, dans une base SQLite.
L’hébergement doit exécuter PHP avec PDO_SQLite activé et autoriser PHP à écrire
dans le dossier data/ (ou dans le dossier défini par la variable
d’environnement MWINUE_COMMENTS_DB).

Le dossier data/ est protégé par .htaccess sur Apache. Sur un hébergement Nginx
ou tout serveur qui n’applique pas les fichiers .htaccess, définissez
MWINUE_COMMENTS_DB vers un chemin situé hors de la racine publique du site.
La base de données est créée automatiquement à la première requête. Si elle
contient déjà des commentaires sans association à un article, ils sont conservés
et rattachés au bilan Octobre Rose 2026.
