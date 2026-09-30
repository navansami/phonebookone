import { SignJWT, jwtVerify } from 'jose';
import { timingSafeEqual } from 'node:crypto';

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  return new TextEncoder().encode(value);
}

function equals(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function checkCredentials(username, password) {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) return false;
  return equals(username, process.env.ADMIN_USERNAME) && equals(password, process.env.ADMIN_PASSWORD);
}

export function checkHotelCode(code) {
  const expected = process.env.HOTEL_ACCESS_CODE;
  return Boolean(expected) && equals(String(code || '').toUpperCase().replace(/-/g, ''), expected.toUpperCase().replace(/-/g, ''));
}

export async function createToken(subject, expires = '24h') {
  return new SignJWT({ role: subject }).setProtectedHeader({ alg: 'HS256' }).setSubject(subject)
    .setIssuedAt().setExpirationTime(expires).sign(secret());
}

export async function adminFromRequest(request) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return false;
  try {
    const { payload } = await jwtVerify(bearer, secret());
    return payload.sub === 'admin' && payload.role === 'admin';
  } catch { return false; }
}
