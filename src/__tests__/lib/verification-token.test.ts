import { generateVerificationToken } from '@/lib/verification-token';

describe('generateVerificationToken', () => {
  it('returns a token and expiry date', () => {
    const result = generateVerificationToken();

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('expires');
    expect(typeof result.token).toBe('string');
    expect(result.expires).toBeInstanceOf(Date);
  });

  it('generates a 64-character hex string (32 bytes)', () => {
    const { token } = generateVerificationToken();

    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('sets expiry to approximately 24 hours from now', () => {
    const before = Date.now();
    const { expires } = generateVerificationToken();
    const after = Date.now();

    const twentyFourHours = 24 * 60 * 60 * 1000;

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + twentyFourHours);
    expect(expires.getTime()).toBeLessThanOrEqual(after + twentyFourHours);
  });

  it('generates unique tokens on successive calls', () => {
    const a = generateVerificationToken();
    const b = generateVerificationToken();

    expect(a.token).not.toBe(b.token);
  });
});
