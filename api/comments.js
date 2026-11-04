import { database } from '../lib/db.js';
import {
  allowMethods, getQueryParam, readJsonBody, requireSameOrigin, sendJson
} from '../lib/http.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['GET', 'POST'])) {
    return;
  }

  try {
    const sql = database();
    if (request.method === 'GET') {
      const slug = getQueryParam(request, 'slug');
      if (!slug) {
        sendJson(response, 400, { error: 'L’actualité est requise.' });
        return;
      }
      const comments = await sql`
        SELECT id, article_slug AS slug, parent_id, message, created_at
        FROM comments
        WHERE article_slug = ${slug}
        ORDER BY id ASC
      `;
      sendJson(response, 200, comments);
      return;
    }

    if (!requireSameOrigin(request, response)) {
      return;
    }

    const payload = readJsonBody(request, response);
    if (!payload) {
      return;
    }
    if (typeof payload.website !== 'string' || payload.website.trim() !== '') {
      sendJson(response, 400, { error: 'La requête n’a pas pu être acceptée.' });
      return;
    }

    const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      sendJson(response, 422, { error: 'L’actualité sélectionnée est invalide.' });
      return;
    }
    if (!message || [...message].length > 2000) {
      sendJson(response, 422, { error: 'Le commentaire doit contenir entre 1 et 2 000 caractères.' });
      return;
    }

    const [article] = await sql`SELECT slug FROM articles WHERE slug = ${slug}`;
    if (!article) {
      sendJson(response, 404, { error: 'Cette actualité est introuvable.' });
      return;
    }

    const parentId = payload.parent_id;
    if (parentId !== null) {
      if (!Number.isSafeInteger(parentId) || parentId < 1) {
        sendJson(response, 422, { error: 'Le commentaire auquel répondre est invalide.' });
        return;
      }
      const [parent] = await sql`
        SELECT id FROM comments WHERE id = ${parentId} AND article_slug = ${slug}
      `;
      if (!parent) {
        sendJson(response, 404, { error: 'Le commentaire auquel répondre est introuvable.' });
        return;
      }
    }

    const [comment] = await sql`
      INSERT INTO comments (article_slug, parent_id, message)
      VALUES (${slug}, ${parentId}, ${message})
      RETURNING id, article_slug AS slug, parent_id, message, created_at
    `;
    sendJson(response, 201, comment);
  } catch (error) {
    console.error('Unable to process comment:', error);
    sendJson(response, 500, { error: 'Le service de commentaires est momentanément indisponible.' });
  }
}
