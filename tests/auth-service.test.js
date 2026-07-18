import { describe, expect, it, vi } from 'vitest';
import { createAuthService } from '../app/src/services/auth.js';

describe('auth service', () => {
  it('returns the current authenticated session', async () => {
    const session = { user: { id: 'user-1' } };
    const client = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }) }
    };

    await expect(createAuthService(client).getSession()).resolves.toBe(session);
    expect(client.auth.getSession).toHaveBeenCalledOnce();
  });

  it('returns null for an anonymous visitor', async () => {
    const client = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) }
    };

    await expect(createAuthService(client).getSession()).resolves.toBeNull();
  });

  it('throws authentication lookup errors', async () => {
    const error = new Error('Auth unavailable');
    const client = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: null, error }) }
    };

    await expect(createAuthService(client).getSession()).rejects.toBe(error);
  });
});
