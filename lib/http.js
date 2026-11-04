export function sendJson(response, status, data, extraHeaders = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  Object.entries(extraHeaders).forEach(([name, value]) => response.setHeader(name, value));
  response.end(JSON.stringify(data));
}

export function allowMethods(request, response, methods) {
  if (methods.includes(request.method)) {
    return true;
  }

  sendJson(response, 405, { error: 'Méthode non autorisée.' }, { Allow: methods.join(', ') });
  return false;
}

export function readJsonBody(request, response, maxBytes = 12000) {
  let body = request.body;

  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body;
  }

  if (Buffer.isBuffer(body)) {
    body = body.toString('utf8');
  }

  if (typeof body !== 'string') {
    return null;
  }

  if (Buffer.byteLength(body, 'utf8') > maxBytes) {
    sendJson(response, 413, { error: 'La requête est trop volumineuse.' });
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    sendJson(response, 400, { error: 'La requête est invalide.' });
    return null;
  }
}

export function requireSameOrigin(request, response) {
  const origin = request.headers.origin;
  const host = request.headers['x-forwarded-host'] || request.headers.host;

  if (!origin || !host) {
    sendJson(response, 403, { error: 'Origine de la requête non autorisée.' });
    return false;
  }

  try {
    if (new URL(origin).host === host) {
      return true;
    }
  } catch {
    // Invalid Origin headers are rejected below.
  }

  sendJson(response, 403, { error: 'Origine de la requête non autorisée.' });
  return false;
}

export function getQueryParam(request, name) {
  const value = new URL(request.url || '/', `https://${request.headers.host || 'localhost'}`)
    .searchParams.get(name);
  return value;
}

export function getCookie(request, name) {
  const cookieHeader = request.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
}
