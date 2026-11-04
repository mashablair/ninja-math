const enc = new TextEncoder();
export const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE = 'ninja_session';

function b64url(bytes) {
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function fromB64url(value) {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/') + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}
function bytesEqual(left, right) {
  if (left.length !== right.length) return false;
  if (typeof crypto.subtle.timingSafeEqual === 'function') return crypto.subtle.timingSafeEqual(left, right);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}
export async function sameSecret(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const [left, right] = await Promise.all([sha256(provided), sha256(expected)]);
  return bytesEqual(left, right);
}
export async function credentialTag(username, password) {
  return b64url(await sha256(`${username}\0${password}`)).slice(0, 16);
}
async function importKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
}
export async function signSession(secret, payload) {
  const body = b64url(enc.encode(JSON.stringify({exp: payload.exp, tag: payload.tag})));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await importKey(secret), enc.encode(body)));
  return `${body}.${b64url(signature)}`;
}
export async function readSession(header, secret, now = Date.now()) {
  if (typeof secret !== 'string' || secret.length < 32 || typeof header !== 'string') return null;
  const match = header.match(/(?:^|;\s*)ninja_session=([^;]+)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  let given;
  try { given = fromB64url(token.slice(dot + 1)); } catch { return null; }
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', await importKey(secret), enc.encode(body)));
  if (!bytesEqual(expected, given)) return null;
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(fromB64url(body))); } catch { return null; }
  if (!payload || typeof payload.exp !== 'number' || payload.exp <= now || typeof payload.tag !== 'string') return null;
  return payload;
}
export function sessionCookie(token) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}`;
}
export function clearSessionCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
