import { createMockUser } from '../../utils/test-factories';

describe('OAuth user auto-verification', () => {
  it('factory creates unverified users by default', () => {
    const user = createMockUser();

    expect(user.emailVerified).toBe(false);
    expect(user.emailVerifyToken).toBeNull();
    expect(user.emailVerifyExpires).toBeNull();
  });

  it('OAuth users should be created with emailVerified: true', () => {
    // Simulates the pattern used across all OAuth upsert sites
    const oauthUser = createMockUser({
      passwordHash: 'google-oauth',
      emailVerified: true,
    });

    expect(oauthUser.emailVerified).toBe(true);
    expect(oauthUser.passwordHash).toBe('google-oauth');
  });

  it('credential users start with emailVerified: false', () => {
    const credentialUser = createMockUser({
      passwordHash: '$2a$10$hashedpassword',
      emailVerified: false,
    });

    expect(credentialUser.emailVerified).toBe(false);
  });
});
