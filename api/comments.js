import { neon } from '@neondatabase/serverless';

const defaultArticle = 'octobre-rose-bilan-2026';
const validArticles = new Set([
  'octobre-rose-realite',
  'voix-et-mobilisation',
  'prevention-priorite',
  'octobre-rose-bilan-2026',
  'toujours-forte',
  'quand-amour-fait-mal',
  'sante-femme-decide',
]);

let client;

function sendJson(response, status, data, extraHeaders = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  Object.entries(extraHeaders).forEach(([name, value]) => response.setHeader(name, value));
  response.end(JSON.stringify(data));
}

function readJsonBody(request, response) {
  const contentLength = Number(request.headers['content-length'] || 0);
  if (contentLength > 10000) {
    sendJson(response, 413, { error: 'La requête est trop volumineuse.' });
    return null;
  }

  let body = request.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 10000) {
      sendJson(response, 413, { error: 'La requête est trop volumineuse.' });
      return null;
    }
    return body;
  }

  if (Buffer.isBuffer(body)) {
    body = body.toString('utf8');
  }
  if (typeof body !== 'string' || Buffer.byteLength(body, 'utf8') > 10000) {
    sendJson(response, typeof body === 'string' ? 413 : 400, {
      error: typeof body === 'string'
        ? 'La requête est trop volumineuse.'
        : 'La requête est invalide.',
    });
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    sendJson(response, 400, { error: 'La requête est invalide.' });
    return null;
  }
}

function hasSameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    sendJson(response, 405, { error: 'Méthode non autorisée.' }, { Allow: 'GET, POST' });
    return;
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured.');
    }
    client ||= neon(process.env.DATABASE_URL);

    if (request.method === 'GET') {
      const url = new URL(request.url || '/', `https://${request.headers.host || 'localhost'}`);
      const article = url.searchParams.get('article') || defaultArticle;
      if (!validArticles.has(article)) {
        sendJson(response, 404, { error: 'Cette actualité est introuvable.' });
        return;
      }

      const comments = await client`
        SELECT id, parent_id, message, created_at
        FROM comments
        WHERE article_slug = ${article}
        ORDER BY id ASC
      `;
      sendJson(response, 200, comments);
      return;
    }

    if (!hasSameOrigin(request)) {
      sendJson(response, 403, { error: 'Origine de la requête non autorisée.' });
      return;
    }
    if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      sendJson(response, 415, { error: 'Le format de la requête n’est pas accepté.' });
      return;
    }

    const payload = readJsonBody(request, response);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      if (payload !== null) {
        sendJson(response, 400, { error: 'La requête est invalide.' });
      }
      return;
    }

    const article = payload.article;
    if (typeof article !== 'string' || !validArticles.has(article)) {
      sendJson(response, 404, { error: 'Cette actualité est introuvable.' });
      return;
    }

    if (typeof payload.website !== 'string' || payload.website.trim() !== '') {
      sendJson(response, 400, { error: 'La requête n’a pas pu être acceptée.' });
      return;
    }

    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!message || Array.from(message).length > 2000) {
      sendJson(response, 422, {
        error: 'Le commentaire doit contenir entre 1 et 2 000 caractères.',
      });
      return;
    }

    const parentId = payload.parent_id ?? null;
    if (parentId !== null && (!Number.isSafeInteger(parentId) || parentId < 1)) {
      sendJson(response, 422, { error: 'Le commentaire auquel répondre est invalide.' });
      return;
    }

    const [existingArticle] = await client`
      SELECT slug FROM articles WHERE slug = ${article}
    `;
    if (!existingArticle) {
      sendJson(response, 404, { error: 'Cette actualité est introuvable.' });
      return;
    }

    if (parentId !== null) {
      const [parent] = await client`
        SELECT id FROM comments WHERE id = ${parentId} AND article_slug = ${article}
      `;
      if (!parent) {
        sendJson(response, 404, { error: 'Le commentaire auquel répondre est introuvable.' });
        return;
      }
    }

    const [comment] = await client`
      INSERT INTO comments (article_slug, parent_id, message)
      VALUES (${article}, ${parentId}, ${message})
      RETURNING id, parent_id, message, created_at
    `;
    sendJson(response, 201, comment);
  } catch (error) {
    console.error('Comments API error:', error);
    sendJson(response, 500, {
      error: 'Le service de commentaires est momentanément indisponible.',
    });
  }
}
