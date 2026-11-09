import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { UserRole } from '@/lib/types';

const JWT_SECRET = process.env.AUTH_SECRET || 'aquapro-super-secure-production-secret-2026-key-@99';
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthPayload {
  userId: string;
  role: UserRole;
  name: string;
  exp: number;
}

/**
 * Securely hashes a plain text password using bcrypt with 10 salt rounds
 */
export function hashPassword(plainPassword: string): string {
  return bcrypt.hashSync(plainPassword, 10);
}

/**
 * Verifies a password against a hash, with seamless legacy plain-text fallback
 */
export function verifyPassword(plainPassword: string, storedHashOrPlain: string): boolean {
  if (!storedHashOrPlain || !plainPassword) return false;

  // Check if it's already a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedHashOrPlain.startsWith('$2a$') || storedHashOrPlain.startsWith('$2b$') || storedHashOrPlain.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(plainPassword, storedHashOrPlain);
    } catch {
      return false;
    }
  }

  // Legacy plain-text fallback: direct match
  return plainPassword === storedHashOrPlain;
}

/**
 * Checks whether a stored password needs to be upgraded to a bcrypt hash
 */
export function needsRehash(storedHashOrPlain: string): boolean {
  if (!storedHashOrPlain) return true;
  return !(storedHashOrPlain.startsWith('$2a$') || storedHashOrPlain.startsWith('$2b$') || storedHashOrPlain.startsWith('$2y$'));
}

/**
 * Generates a signed, tamper-proof session token with expiry
 */
export function createSessionToken(userId: string, role: UserRole, name: string): string {
  const payload: AuthPayload = {
    userId,
    role,
    name,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies and decodes a signed session token
 */
export function verifySessionToken(token: string): AuthPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(payloadB64)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null; // Tampered token!
  }

  try {
    const payload: AuthPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) {
      return null; // Expired token
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from an incoming Next.js API Request
 */
export function getAuthFromRequest(req: NextRequest): AuthPayload | null {
  // 1. Try Authorization header: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifySessionToken(token);
    if (payload) return payload;
  }

  // 2. Try x-auth-token header
  const customHeader = req.headers.get('x-auth-token');
  if (customHeader) {
    const payload = verifySessionToken(customHeader.trim());
    if (payload) return payload;
  }

  // 3. Try cookies: aquapro_session
  const cookieToken = req.cookies.get('aquapro_session')?.value;
  if (cookieToken) {
    const payload = verifySessionToken(cookieToken);
    if (payload) return payload;
  }

  return null;
}

/**
 * Strict authorization guard for API routes
 */
export function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): { authorized: boolean; user?: AuthPayload; error?: string; status: number } {
  const user = getAuthFromRequest(req);

  if (!user) {
    return {
      authorized: false,
      error: 'غير مصرح: يرجى تسجيل الدخول أولاً',
      status: 401,
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      error: 'غير مصرح: لا تملك الصلاحيات الكافية للوصول لهذه البيانات',
      status: 403,
    };
  }

  return {
    authorized: true,
    user,
    status: 200,
  };
}
