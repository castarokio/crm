import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export type CallerRole = 'Admin' | 'Supervisor' | 'Caller' | 'Viewer';

export type CallerSession = {
  name: string;
  role: CallerRole;
  expiresAt: number;
};

const PORTAL_COOKIE = '__callos_portal';
const CALLER_COOKIE = '__callos_caller';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET_NOT_CONFIGURED');
  return secret;
}

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function createToken(payload: object) {
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function readToken<T>(token?: string): T | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(decode(payload)) as T;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export async function setPortalSession() {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const store = await cookies();
  store.set(PORTAL_COOKIE, createToken({ expiresAt }), cookieOptions());
}

export async function hasPortalSession() {
  const store = await cookies();
  const session = readToken<{ expiresAt: number }>(store.get(PORTAL_COOKIE)?.value);
  return Boolean(session && session.expiresAt > Date.now());
}

export async function setCallerSession(name: string, role: CallerRole) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const store = await cookies();
  store.set(CALLER_COOKIE, createToken({ name, role, expiresAt }), cookieOptions());
}

export async function getCallerSession(): Promise<CallerSession | null> {
  const store = await cookies();
  const session = readToken<CallerSession>(store.get(CALLER_COOKIE)?.value);
  if (!session || session.expiresAt <= Date.now()) return null;
  return session;
}

export async function clearAuthSession() {
  const store = await cookies();
  store.set(PORTAL_COOKIE, '', cookieOptions(0));
  store.set(CALLER_COOKIE, '', cookieOptions(0));
}

export async function requireCallerSession() {
  const session = await getCallerSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export async function requireRole(roles: CallerRole[]) {
  const session = await requireCallerSession();
  if (!roles.includes(session.role)) throw new Error('FORBIDDEN');
  return session;
}

export async function requireWritableSession() {
  return requireRole(['Admin', 'Supervisor', 'Caller']);
}

export async function requireAdminSession() {
  return requireRole(['Admin']);
}
