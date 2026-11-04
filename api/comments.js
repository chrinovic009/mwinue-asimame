import { neon } from '@neondatabase/serverless';

const defaultArticle = 'octobre-rose-bilan-2026';
const articles = {
  'octobre-rose-realite': {
    title: 'Octobre Rose n’est pas le rose. C’est une réalité.',
    summary: 'Nous avons rappelé que derrière les rubans et les campagnes se cachent des femmes qui vivent l’anxiété, le doute ou la difficulté d’accéder aux soins. Le cancer du sein n’est pas un sujet décoratif : c’est une réalité qui mérite notre attention.',
    category: 'Sensibilisation',
  },
  'voix-et-mobilisation': {
    title: 'Et si votre voix pouvait faire la différence ?',
    summary: 'Merci à toutes celles qui se sont mobilisées. Votre participation a rendu visible une cause qui nous concerne toutes. L’information et l’accès aux soins comptent ; le cancer du sein ne doit ni être un tabou ni une fatalité.',
    category: 'Mobilisation',
  },
  'prevention-priorite': {
    title: 'Faire de la prévention une priorité',
    summary: 'Nous avons uni nos efforts avec le Centre de Diagnostic Eyano pour promouvoir le dépistage, renforcer la prévention et encourager les entreprises, institutions et partenaires à s’engager dans cette lutte.',
    category: 'Partenariat',
  },
  'octobre-rose-bilan-2026': {
    title: 'Octobre Rose : un mois s’achève, mais la lutte continue',
    summary: 'Merci à nos partenaires, intervenants et femmes mobilisées pour avoir fait de cette campagne un moment fort de sensibilisation et d’engagement. Octobre Rose prend fin, mais notre combat pour l’information, le dépistage et l’accès aux soins continue.',
    category: 'Bilan final',
  },
  'toujours-forte': {
    title: 'Toujours forte... Mais à quel prix ?',
    summary: 'Un temps d’échange autour de la charge mentale des femmes et de conseils pratiques pour retrouver son équilibre, ponctué d’un atelier de peinture et d’un moment de networking.',
    category: 'Article',
  },
  'quand-amour-fait-mal': {
    title: 'Quand l’amour fait mal',
    summary: 'Une rencontre pour comprendre les violences conjugales et protéger la santé, la dignité et la vie des femmes : reconnaître les signes d’alerte, connaître ses droits et les moyens de protection, puis se reconstruire et aller de l’avant.',
    category: 'Article',
  },
  'sante-femme-decide': {
    title: 'La santé de la femme, qui décide vraiment ?',
    summary: 'Un échange sur les décisions qui concernent la santé des femmes, leur droit à être informées et écoutées, et l’importance de pouvoir faire des choix éclairés pour leur bien-être.',
    category: 'Article',
  },
};

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
      if (!Object.hasOwn(articles, article)) {
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
    if (typeof article !== 'string' || !Object.hasOwn(articles, article)) {
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
      const { title, summary, category } = articles[article];
      await client`
        INSERT INTO articles (slug, title, summary, category, body)
        VALUES (${article}, ${title}, ${summary}, ${category}, ${summary})
        ON CONFLICT (slug) DO NOTHING
      `;
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
