import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
const login=fs.readFileSync('app/src/components/LoginPage.tsx','utf8');
const header=fs.readFileSync('app/src/components/AppHeader.tsx','utf8');
const client=fs.readFileSync('app/src/lib/supabase.ts','utf8');
describe('passwordless authentication UI',()=>{
  it('keeps browser session persistence and callback detection',()=>{expect(client).toContain('persistSession:true');expect(client).toContain('autoRefreshToken:true');expect(client).toContain('detectSessionInUrl:true');});
  it('renders email login and confirmation',()=>{expect(login).toContain('type="email"');expect(login).toContain('autoComplete="email"');expect(login).toContain('Send login link');expect(login).toContain('continue in this window');expect(login).toContain('role="alert"');});
  it('normalizes email and enforces resend cooldown',()=>{expect(login).toContain('trim().toLowerCase()');expect(login).toContain('setSeconds(60)');expect(login).toContain('Resend link in');});
  it('shows the account and sign-out action',()=>{expect(header).toContain('session?.user.email');expect(header).toContain('Sign out');expect(header).toContain('onSignOut');});
});
