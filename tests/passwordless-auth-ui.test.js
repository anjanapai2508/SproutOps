import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const main = fs.readFileSync('app/src/main.js', 'utf8');
const client = fs.readFileSync('app/src/lib/supabase.js', 'utf8');

describe('passwordless authentication UI', () => {
  it('configures persisted, automatically refreshed Supabase sessions', () => {
    expect(client).toContain('persistSession: true');
    expect(client).toContain('autoRefreshToken: true');
    expect(client).toContain('detectSessionInUrl: true');
  });

  it('renders an accessible email form and magic-link confirmation', () => {
    expect(main).toContain('type="email" autocomplete="email"');
    expect(main).toContain('Send login link');
    expect(main).toContain('Open the email and click the link to continue to SproutOps.');
    expect(main).not.toContain('autocomplete="one-time-code"');
    expect(main).toContain('role="alert" tabindex="-1"');
    expect(main).toContain('aria-busy="${state.authBusy}"');
  });

  it('normalizes email and enforces a sixty-second resend cooldown', () => {
    expect(main).toContain("trim().toLowerCase()");
    expect(main).toContain('state.resendSeconds=60');
    expect(main).toContain('Resend link in ${state.resendSeconds}s');
  });

  it('shows authenticated account details and a sign-out action', () => {
    expect(main).toContain("state.session?.user?.email");
    expect(main).toContain('data-action="sign-out"');
    expect(main).toContain('await signOut()');
  });
});
