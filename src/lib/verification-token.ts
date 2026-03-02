import crypto from 'crypto';

// 24 hours — longer than password reset (1h) because users may not
// check email immediately after signup.
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generateVerificationToken(): {
  token: string;
  expires: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  return { token, expires };
}
