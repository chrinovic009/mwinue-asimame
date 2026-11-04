<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Méthode non autorisée.']);
}

$defaultArticle = 'octobre-rose-bilan-2026';
$validArticles = [
    'octobre-rose-realite',
    'voix-et-mobilisation',
    'prevention-priorite',
    'octobre-rose-bilan-2026',
    'toujours-forte',
    'quand-amour-fait-mal',
    'sante-femme-decide',
];

if (!extension_loaded('pdo_sqlite')) {
    error_log('The comments service requires the PDO SQLite extension.');
    respond(500, ['error' => 'Le service de commentaires est momentanément indisponible.']);
}

$databasePath = getenv('MWINUE_COMMENTS_DB');
if ($databasePath === false || $databasePath === '') {
    $databasePath = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'comments.sqlite';
}

try {
    $databaseDirectory = dirname($databasePath);
    if (!is_dir($databaseDirectory) && !@mkdir($databaseDirectory, 0750, true) && !is_dir($databaseDirectory)) {
        throw new RuntimeException('Unable to create the comments database directory.');
    }

    $database = new PDO('sqlite:' . $databasePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $database->exec('PRAGMA foreign_keys = ON');
    $database->exec(
        'CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER NULL REFERENCES comments(id) ON DELETE CASCADE,
            message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 2000),
            created_at TEXT NOT NULL DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\', \'now\'))
        )'
    );
    $columns = $database->query('PRAGMA table_info(comments)')->fetchAll(PDO::FETCH_COLUMN, 1);
    if (!in_array('article_slug', $columns, true)) {
        $database->exec(
            "ALTER TABLE comments ADD COLUMN article_slug TEXT NOT NULL DEFAULT 'octobre-rose-bilan-2026'"
        );
    }
    $database->exec(
        'CREATE INDEX IF NOT EXISTS comments_article_parent_idx ON comments(article_slug, parent_id, id)'
    );

    if ($method === 'GET') {
        $articleSlug = $_GET['article'] ?? $defaultArticle;
        if (!is_string($articleSlug) || !in_array($articleSlug, $validArticles, true)) {
            respond(404, ['error' => 'Cette actualité est introuvable.']);
        }
        $query = $database->prepare(
            'SELECT id, parent_id, message, created_at FROM comments WHERE article_slug = :article_slug ORDER BY id ASC'
        );
        $query->execute(['article_slug' => $articleSlug]);
        $comments = $query->fetchAll();
        respond(200, $comments);
    }

    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 10000) {
        respond(413, ['error' => 'La requête est trop volumineuse.']);
    }

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== 0) {
        respond(415, ['error' => 'Le format de la requête n’est pas accepté.']);
    }

    $requestBody = @file_get_contents('php://input', false, null, 0, 10001);
    if ($requestBody === false) {
        error_log('Unable to read the comments request body.');
        respond(400, ['error' => 'La requête est invalide.']);
    }
    if (strlen($requestBody) > 10000) {
        respond(413, ['error' => 'La requête est trop volumineuse.']);
    }

    $payload = json_decode($requestBody, true);
    if (!is_array($payload)) {
        respond(400, ['error' => 'La requête est invalide.']);
    }

    $articleSlug = $payload['article'] ?? $defaultArticle;
    if (!is_string($articleSlug) || !in_array($articleSlug, $validArticles, true)) {
        respond(404, ['error' => 'Cette actualité est introuvable.']);
    }

    $website = $payload['website'] ?? '';
    if (!is_string($website) || trim($website) !== '') {
        respond(400, ['error' => 'La requête n’a pas pu être acceptée.']);
    }

    $message = isset($payload['message']) && is_string($payload['message'])
        ? trim($payload['message'])
        : '';
    if ($message === '' || preg_match('/^.{1,2000}$/us', $message) !== 1) {
        respond(422, ['error' => 'Le commentaire doit contenir entre 1 et 2 000 caractères.']);
    }

    $parentId = $payload['parent_id'] ?? null;
    if ($parentId !== null) {
        if (!is_int($parentId) || $parentId < 1) {
            respond(422, ['error' => 'Le commentaire auquel répondre est invalide.']);
        }
        $parentQuery = $database->prepare(
            'SELECT 1 FROM comments WHERE id = :id AND article_slug = :article_slug'
        );
        $parentQuery->execute(['id' => $parentId, 'article_slug' => $articleSlug]);
        if ($parentQuery->fetchColumn() === false) {
            respond(404, ['error' => 'Le commentaire auquel répondre est introuvable.']);
        }
    }

    $insert = $database->prepare(
        'INSERT INTO comments (article_slug, parent_id, message) VALUES (:article_slug, :parent_id, :message)'
    );
    $insert->execute([
        'article_slug' => $articleSlug,
        'parent_id' => $parentId,
        'message' => $message,
    ]);

    $created = $database->prepare(
        'SELECT id, parent_id, message, created_at FROM comments WHERE id = :id'
    );
    $created->execute(['id' => (int) $database->lastInsertId()]);
    $newComment = $created->fetch();
    if ($newComment === false) {
        throw new RuntimeException('Unable to retrieve the newly created comment.');
    }
    respond(201, $newComment);
} catch (PDOException | RuntimeException $error) {
    error_log('Comments service error: ' . $error->getMessage());
    respond(500, ['error' => 'Le service de commentaires est momentanément indisponible.']);
}
