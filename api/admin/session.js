import {
  checkLoginRateLimit, clearLoginFailures, clearSessionCookie,
  createSessionCookie, hasValidSession, recordLoginFailure, verifyAdminCredentials
} from '../../lib/auth.js';
import { allowMethods, readJsonBody, requireSameOrigin, sendJson } from '../../lib/http.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['GET', 'POST', 'DELETE'])) {
    return;
  }

  if (request.method === 'GET') {
    try {
      sendJson(response, 200, { authenticated: hasValidSession(request) });
    } catch (error) {
      console.error('Unable to verify admin session:', error);
      sendJson(response, 500, { error: 'La configuration de l’administration est incomplète.' });
    }
    return;
  }

  if (!requireSameOrigin(request, response)) {
    return;
  }

  if (request.method === 'DELETE') {
    sendJson(response, 200, { authenticated: false }, {
      'Set-Cookie': clearSessionCookie(request)
    });
    return;
  }

  try {
    if (!await checkLoginRateLimit(request, response)) {
      return;
    }
    const payload = readJsonBody(request, response, 4000);
    if (!payload) {
      return;
    }
    const username = typeof payload.username === 'string' ? payload.username : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!await verifyAdminCredentials(username, password)) {
      await recordLoginFailure(request);
      sendJson(response, 401, { error: 'Identifiants incorrects.' });
      return;
    }

    await clearLoginFailures(request);
    sendJson(response, 200, { authenticated: true }, {
      'Set-Cookie': createSessionCookie(request)
    });
  } catch (error) {
    console.error('Admin authentication error:', error);
    sendJson(response, 500, { error: 'La configuration de l’administration est incomplète.' });
  }
}
