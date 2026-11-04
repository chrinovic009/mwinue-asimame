import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { database } from './db.js';
import { getCookie, sendJson } from './http.js';

const scrypt = promisify(scryptCallback);
const cookieName = 'mwinue_admin_session';
const sessionLifetimeSeconds = 60 * 60 * 8;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }
  return secret;
}

function sign(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function verifyAdminCredentials(username, password) {
  const configuredUsername = process.env.ADMIN_USERNAME;
  const encodedHash = process.env.ADMIN_PASSWORD_HASH || '';
  const [saltHex, expectedHex] = encodedHash.split(':');

  if (!configuredUsername || !saltHex || !expectedHex || !password) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  if (salt.length < 16 || expected.length !== 64) {
    throw new Error('ADMIN_PASSWORD_HASH has an invalid format.');
  }

  const actual = await scrypt(password, salt, expected.length);
  return safeEqual(username, configuredUsername) && timingSafeEqual(actual, expected);
}

export function createSessionCookie(request) {
  const expires = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const nonce = randomBytes(24).toString('base64url');
  const value = `${expires}.${nonce}`;
  const secure = request.headers['x-forwarded-proto'] === 'https'
    || ['production', 'preview'].includes(process.env.VERCEL_ENV);

  return `${cookieName}=${encodeURIComponent(`${value}.${sign(value)}`)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetimeSeconds}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(request) {
  const secure = request.headers['x-forwarded-proto'] === 'https'
    || ['production', 'preview'].includes(process.env.VERCEL_ENV);
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function hasValidSession(request) {
  const parts = getCookie(request, cookieName).split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || !nonce || Number(expires) < Math.floor(Date.now() / 1000)) {
    return false;
  }

  return safeEqual(signature, sign(`${expires}.${nonce}`));
}

export function requireAdmin(request, response) {
  try {
    if (hasValidSession(request)) {
      return true;
    }
  } catch (error) {
    console.error('Admin session configuration error:', error);
    sendJson(response, 500, { error: 'La configuration de l’administration est incomplète.' });
    return false;
  }

  sendJson(response, 401, { error: 'Authentification requise.' });
  return false;
}

export async function checkLoginRateLimit(request, response) {
  const clientIp = String(
    request.headers['x-real-ip']
      || request.headers['x-forwarded-for']?.split(',').pop()?.trim()
      || request.socket?.remoteAddress
      || 'unknown'
  ).slice(0, 100);
  const sql = database();
  const [attempt] = await sql`
    SELECT failed_attempts, locked_until
    FROM admin_login_attempts
    WHERE ip_address = ${clientIp}
  `;

  if (attempt?.locked_until && new Date(attempt.locked_until).getTime() > Date.now()) {
    const retryAfter = Math.max(1, Math.ceil(
      (new Date(attempt.locked_until).getTime() - Date.now()) / 1000
    ));
    sendJson(response, 429, { error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, {
      'Retry-After': String(retryAfter)
    });
    return false;
  }

  return true;
}

export async function recordLoginFailure(request) {
  const clientIp = String(
    request.headers['x-real-ip']
      || request.headers['x-forwarded-for']?.split(',').pop()?.trim()
      || request.socket?.remoteAddress
      || 'unknown'
  ).slice(0, 100);
  const sql = database();
  await sql`
    INSERT INTO admin_login_attempts (ip_address, failed_attempts, locked_until)
    VALUES (${clientIp}, 1, NULL)
    ON CONFLICT (ip_address) DO UPDATE SET
      failed_attempts = CASE
        WHEN admin_login_attempts.locked_until IS NOT NULL
          AND admin_login_attempts.locked_until <= NOW() THEN 1
        ELSE admin_login_attempts.failed_attempts + 1
      END,
      locked_until = CASE
        WHEN admin_login_attempts.locked_until IS NOT NULL
          AND admin_login_attempts.locked_until <= NOW() THEN NULL
        WHEN admin_login_attempts.failed_attempts + 1 >= 5
          THEN NOW() + INTERVAL '15 minutes'
        ELSE admin_login_attempts.locked_until
      END
  `;
}

export async function clearLoginFailures(request) {
  const clientIp = String(
    request.headers['x-real-ip']
      || request.headers['x-forwarded-for']?.split(',').pop()?.trim()
      || request.socket?.remoteAddress
      || 'unknown'
  ).slice(0, 100);
  const sql = database();
  await sql`DELETE FROM admin_login_attempts WHERE ip_address = ${clientIp}`;
}
