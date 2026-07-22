import { describe, expect, it, vi } from 'vitest';
import { createAuthService } from '../app/src/services/auth.ts';

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

  it('sends a Supabase email login link and allows new users', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signInWithOtp } };

    await createAuthService(client).sendLoginLink('person@example.com');

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'person@example.com',
      options: { shouldCreateUser: true }
    });
  });

  it('starts Google OAuth in the current application origin', async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signInWithOAuth } };

    await createAuthService(client).signInWithGoogle('https://sproutops.example.com');

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://sproutops.example.com' }
    });
  });

  it('propagates Google OAuth startup errors', async () => {
    const error = new Error('Provider unavailable');
    const client = { auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error }) } };

    await expect(createAuthService(client).signInWithGoogle('http://localhost:4175')).rejects.toBe(error);
  });

  it('signs out and exposes an unsubscribable auth listener', async () => {
    const unsubscribe = vi.fn();
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const onAuthStateChange = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe } } });
    const client = { auth: { signOut, onAuthStateChange } };
    const service = createAuthService(client);
    const listener = vi.fn();

    const stop = service.onAuthStateChange(listener);
    onAuthStateChange.mock.calls[0][0]('SIGNED_IN', { user: { id: 'user-1' } });
    await service.signOut();
    stop();

    expect(listener).toHaveBeenCalledWith({ user: { id: 'user-1' } });
    expect(signOut).toHaveBeenCalledOnce();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
