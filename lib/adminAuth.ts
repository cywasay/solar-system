import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/*
 * Admin auth is a signed session cookie, not the password itself.
 *
 * The password is sent exactly once, to POST /api/admin/session. On success the server
 * sets an httpOnly cookie holding `expiry.nonce.signature` — page scripts can't read it,
 * so an XSS bug can no longer lift the admin password out of localStorage, and
 * SameSite=Strict keeps other sites from riding the session.
 *
 * Sessions are stateless (no table), so signing out only clears this browser's cookie.
 * The signing key is derived from ADMIN_PASSWORD, so changing the password revokes every
 * outstanding session at once. ADMIN_SESSION_SECRET, if set, is mixed in too, so a
 * stolen cookie can't be used to brute-force the password offline.
 */

/*
 * No default password. A fallback secret meant that a deployment missing ADMIN_PASSWORD
 * was wide open to anyone who knew (or read in the docs) the fallback value. Without the
 * variable, every admin request is refused instead.
 */
const MIN_PASSWORD_LENGTH = 12;

/** The old fallback is published in the project docs, so it can never be a real secret. */
const KNOWN_PUBLIC_PASSWORDS = new Set(['admin123secret']);

export const SESSION_COOKIE = 'thessaris_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;

/** Scoped to the admin API: the cookie is never sent with public page or asset requests. */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/admin',
} as const;

const sha256 = (value: string) => createHash('sha256').update(value).digest();

/** The configured password, or null when admin access must stay disabled. */
export function configuredAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < MIN_PASSWORD_LENGTH || KNOWN_PUBLIC_PASSWORDS.has(password)) {
    console.error(
      `[admin] ADMIN_PASSWORD is missing, shorter than ${MIN_PASSWORD_LENGTH} characters, or a publicly known value — admin access is disabled.`
    );
    return null;
  }
  return password;
}

// Hash both sides so the comparison is fixed-length and constant-time: a plain `!==`
// returns as soon as a character differs, which leaks how much of a guess was right.
export function passwordMatches(candidate: string, password: string): boolean {
  return timingSafeEqual(sha256(candidate), sha256(password));
}

function sign(payload: string, password: string): string {
  const key = sha256(`${process.env.ADMIN_SESSION_SECRET ?? ''}\0${password}`);
  return createHmac('sha256', key).update(payload).digest('base64url');
}

/** Issues a fresh session cookie on the current response. */
export async function startAdminSession(password: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${expires}.${randomBytes(16).toString('base64url')}`;
  const store = await cookies();
  store.set(SESSION_COOKIE, `${payload}.${sign(payload, password)}`, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endAdminSession() {
  const store = await cookies();
  // Same path as when set, or the browser treats it as a different cookie and keeps it.
  store.set(SESSION_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
}

/** True when the request carries a valid, unexpired session cookie. */
export async function authenticateAdmin(): Promise<boolean> {
  const password = configuredAdminPassword();
  if (!password) return false;

  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  const parts = value?.split('.');
  if (!parts || parts.length !== 3) return false;

  const [expires, nonce, signature] = parts;
  const expected = Buffer.from(sign(`${expires}.${nonce}`, password));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;

  return Number(expires) > Date.now() / 1000;
}
