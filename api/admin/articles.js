import { database } from '../../lib/db.js';
import { hasValidSession } from '../../lib/auth.js';
import {
  allowMethods, readJsonBody, requireSameOrigin, sendJson
} from '../../lib/http.js';

function slugify(value) {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

function validImageUrl(value) {
  if (!value) {
    return true;
  }
  if (value.startsWith('/') && !value.startsWith('//')) {
    return true;
  }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) {
    return;
  }
  if (!requireSameOrigin(request, response)) {
    return;
  }
  try {
    if (!hasValidSession(request)) {
      sendJson(response, 401, { error: 'Authentification requise.' });
      return;
    }
  } catch (error) {
    console.error('Unable to verify admin session:', error);
    sendJson(response, 500, { error: 'La configuration de l’administration est incomplète.' });
    return;
  }

  const payload = readJsonBody(request, response, 30000);
  if (!payload) {
    return;
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
  const category = typeof payload.category === 'string' ? payload.category.trim() : '';
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  const imageUrl = typeof payload.image_url === 'string' ? payload.image_url.trim() : '';

  if (!title || [...title].length > 180 || !summary || [...summary].length > 500
      || !body || [...body].length > 20000 || !category || [...category].length > 80) {
    sendJson(response, 422, { error: 'Vérifiez les champs : titre, résumé, catégorie et article sont obligatoires.' });
    return;
  }
  if (!validImageUrl(imageUrl)) {
    sendJson(response, 422, { error: 'L’image doit être un chemin local ou une adresse HTTPS.' });
    return;
  }

  const slug = slugify(title);
  if (!slug) {
    sendJson(response, 422, { error: 'Le titre ne permet pas de créer une adresse d’article.' });
    return;
  }

  try {
    const sql = database();
    const [existing] = await sql`SELECT slug FROM articles WHERE slug = ${slug}`;
    if (existing) {
      sendJson(response, 409, { error: 'Une actualité porte déjà ce titre. Choisissez un titre différent.' });
      return;
    }
    const [article] = await sql`
      INSERT INTO articles (slug, title, summary, image_url, category, body)
      VALUES (${slug}, ${title}, ${summary}, ${imageUrl || null}, ${category}, ${body})
      RETURNING slug, title, summary, image_url, category, body, published_at
    `;
    sendJson(response, 201, article);
  } catch (error) {
    console.error('Unable to publish article:', error);
    sendJson(response, 500, { error: 'La publication de l’actualité a échoué.' });
  }
}
