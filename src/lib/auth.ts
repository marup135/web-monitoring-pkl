import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'nebo-track-session-secret-key-987654321';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function signSession(userId: string): string {
  const signature = crypto.createHmac('sha256', SECRET).update(userId).digest('hex');
  return `${userId}.${signature}`;
}

export function verifySession(cookieValue: string): string | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [userId, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SECRET).update(userId).digest('hex');
  if (signature === expectedSignature) return userId;
  return null;
}
