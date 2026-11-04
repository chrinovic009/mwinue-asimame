import { database } from '../lib/db.js';
import { allowMethods, getQueryParam, sendJson } from '../lib/http.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['GET'])) {
    return;
  }

  try {
    const sql = database();
    const slug = getQueryParam(request, 'slug');
    if (slug) {
      const [article] = await sql`
        SELECT slug, title, summary, image_url, category, body, published_at
        FROM articles
        WHERE slug = ${slug}
      `;
      if (!article) {
        sendJson(response, 404, { error: 'Cette actualité est introuvable.' });
        return;
      }
      sendJson(response, 200, article);
      return;
    }

    const articles = await sql`
      SELECT slug, title, summary, image_url, category, body, published_at
      FROM articles
      ORDER BY published_at DESC, slug ASC
    `;
    sendJson(response, 200, articles);
  } catch (error) {
    console.error('Unable to load articles:', error);
    sendJson(response, 500, { error: 'Les actualités sont momentanément indisponibles.' });
  }
}
