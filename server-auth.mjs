import crypto from 'node:crypto';
import { storeGet, storeSet } from './server-store.mjs';

const COOKIE_NAME = 'specpage_session';
const rateBuckets = new Map();
let cachedSessionSecret = null;

export function applySecurityHeaders(res, req) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (isHttpsRequest(req)) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

export function isHttpsRequest(req) {
  const proto = req?.headers?.['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.split(',')[0].trim() === 'https') {
    return true;
  }
  return Boolean(req?.socket?.encrypted);
}

function getClientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req?.socket?.remoteAddress || 'unknown';
}

export function checkRateLimit(req, bucket, limit, windowMs) {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${bucket}:${ip}`;
  const cutoff = now - windowMs;

  const existing = (rateBuckets.get(key) || []).filter((ts) => ts > cutoff);
  if (existing.length >= limit) {
    const oldest = existing[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateBuckets.set(key, existing);
    return { allowed: false, retryAfterSec };
  }

  existing.push(now);
  rateBuckets.set(key, existing);

  if (rateBuckets.size > 2000) {
    for (const [k, list] of rateBuckets.entries()) {
      if (list.every((ts) => ts <= cutoff)) rateBuckets.delete(k);
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}

function parseCookies(req) {
  const header = req?.headers?.cookie;
  const out = {};
  if (!header || typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[name] = decodeURIComponent(val);
  }
  return out;
}

async function getSessionSecret(rootDir) {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }
  if (cachedSessionSecret) return cachedSessionSecret;

  const stored = await storeGet('session_secret', null, rootDir);
  if (stored && typeof stored.secret === 'string' && stored.secret.length >= 32) {
    cachedSessionSecret = stored.secret;
    return cachedSessionSecret;
  }

  const generated = crypto.randomBytes(32).toString('hex');
  await storeSet('session_secret', { secret: generated }, rootDir);
  cachedSessionSecret = generated;
  return generated;
}

function hashScrypt(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function safeEqualStrings(a, b) {
  const bufA = crypto.createHash('sha256').update(String(a)).digest();
  const bufB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateReviewToken() {
  return crypto.randomBytes(16).toString('hex');
}

export function verifySameOrigin(req) {
  const method = (req?.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const expectedHost = (
    req?.headers?.['x-forwarded-host'] ||
    req?.headers?.host ||
    ''
  )
    .toString()
    .split(',')[0]
    .trim()
    .toLowerCase();

  if (!expectedHost) return true;

  const origin = req?.headers?.origin;
  if (typeof origin === 'string' && origin.trim()) {
    if (origin === 'null') return false;
    try {
      const parsed = new URL(origin);
      return parsed.host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  const referer = req?.headers?.referer;
  if (typeof referer === 'string' && referer.trim()) {
    try {
      const parsed = new URL(referer);
      return parsed.host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  return true;
}

export async function getAuthState(rootDir = process.cwd()) {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (envPass) {
    return { configured: true, envManaged: true };
  }
  const stored = await storeGet('admin_auth', null, rootDir);
  return {
    configured: Boolean(stored && typeof stored.hash === 'string' && typeof stored.salt === 'string'),
    envManaged: false,
  };
}

export async function setupFirstAdminPassword(password, rootDir = process.cwd()) {
  const state = await getAuthState(rootDir);
  if (state.configured) {
    return { ok: false, status: 403, error: 'Mật khẩu quản trị đã được thiết lập trước đó.' };
  }
  if (typeof password !== 'string' || password.trim().length < 8) {
    return { ok: false, status: 400, error: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashScrypt(password.trim(), salt);
  await storeSet('admin_auth', { salt, hash, createdAt: new Date().toISOString() }, rootDir);
  return { ok: true };
}

export async function verifyAdminPassword(password, rootDir = process.cwd()) {
  if (typeof password !== 'string' || !password) return false;

  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (envPass) {
    return safeEqualStrings(password, envPass);
  }

  const stored = await storeGet('admin_auth', null, rootDir);
  if (!stored || typeof stored.salt !== 'string' || typeof stored.hash !== 'string') {
    return false;
  }

  const candidateHex = hashScrypt(password, stored.salt);
  const candidateBuf = Buffer.from(candidateHex, 'hex');
  const storedBuf = Buffer.from(stored.hash, 'hex');
  if (candidateBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, storedBuf);
}

export async function changeAdminPassword(currentPassword, nextPassword, rootDir = process.cwd()) {
  const state = await getAuthState(rootDir);
  if (state.envManaged) {
    return {
      ok: false,
      status: 400,
      error: 'Mật khẩu đang được quản lý bởi biến môi trường ADMIN_PASSWORD trên server.',
    };
  }
  const validCurrent = await verifyAdminPassword(currentPassword, rootDir);
  if (!validCurrent) {
    return { ok: false, status: 401, error: 'Mật khẩu hiện tại không đúng.' };
  }
  if (typeof nextPassword !== 'string' || nextPassword.trim().length < 8) {
    return { ok: false, status: 400, error: 'Mật khẩu mới phải có ít nhất 8 ký tự.' };
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashScrypt(nextPassword.trim(), salt);
  await storeSet('admin_auth', { salt, hash, updatedAt: new Date().toISOString() }, rootDir);
  return { ok: true };
}

export async function createSessionCookie(req, rememberMe = true, rootDir = process.cwd()) {
  const secret = await getSessionSecret(rootDir);
  const maxAgeSec = rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
  const nowSec = Math.floor(Date.now() / 1000);
  const payloadB64 = Buffer.from(
    JSON.stringify({ iat: nowSec, exp: nowSec + maxAgeSec, v: 1 }),
    'utf8'
  ).toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  const token = `${payloadB64}.${sigB64}`;
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ];
  if (isHttpsRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie(req) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isHttpsRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

export async function isRequestAuthenticated(req, rootDir = process.cwd()) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token || typeof token !== 'string') return false;

  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return false;
  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);

  try {
    const secret = await getSessionSecret(rootDir);
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(sigB64, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    return typeof payload.exp === 'number' && payload.exp > nowSec;
  } catch {
    return false;
  }
}
