# Google Sign-In Design

## Goal

Add Google account sign-in to the SproutOps login page while preserving the existing email magic-link option and all current application behavior after authentication.

## Authentication Flow

The login page will start Google authentication through Supabase Auth using `signInWithOAuth` with provider `google`. The request will set `redirectTo` to the current application origin so localhost, built-in browser, and production sessions return to the same window and origin that initiated authentication.

The implementation will use a normal same-window browser redirect. It will not open a popup or call `window.open`. The existing Supabase client options—persistent sessions, automatic token refresh, and URL session detection—will process the OAuth callback. The existing `onAuthStateChange` subscription will then render the authenticated application.

## Login Page

The login card will retain its current logo, typography, dimensions, email form, confirmation state, cooldown, and error handling.

Before the email form, it will add:

- a primary “Continue with Google” button;
- an accessible Google mark or restrained visual indicator;
- a busy state while OAuth startup is being requested;
- a short divider reading “or continue with email.”

Google and email requests will not run concurrently. Starting either action disables the relevant authentication controls until the call resolves or redirects. If Supabase rejects the OAuth startup request, the page will remain visible and show a concise error message through the existing alert region.

## Service Boundary

The authentication service will expose `signInWithGoogle(redirectTo: string): Promise<void>`. It will call:

```ts
client.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo }
})
```

Any returned Supabase error will be thrown for the UI to handle. No provider access token will be stored because SproutOps only needs Supabase authentication, not direct access to Google APIs.

## External Supabase and Google Configuration

Code alone cannot enable the provider. The deployment owner must:

1. Create or select a Google OAuth web client.
2. Register the Supabase Google callback URL in Google Cloud.
3. Enable Google in the Supabase Auth providers dashboard using the client ID and client secret.
4. Add every permitted SproutOps return origin to Supabase Auth Redirect URLs, including the localhost preview origin and production HTTPS origin.

The Google client secret belongs only in the Supabase dashboard. It must never be added to this repository, GitHub Actions, Vite variables, Docker build arguments, or browser code.

## Error Handling

- OAuth startup failures display “We couldn't start Google sign-in. Please try again.”
- Network-oriented failures may retain the existing connection guidance.
- Callback or provider configuration failures remain on the login page and are diagnosable through Supabase Auth logs; no sensitive error details are rendered to users.
- Email magic-link behavior and messages remain unchanged.

## Testing

Service tests will verify the exact `signInWithOAuth` provider and redirect options and confirm that Supabase errors are propagated.

Login UI tests will verify that Google is the primary option, email remains available as fallback, the same-window service is used, and no popup API is introduced. Existing authentication and full application tests must continue passing, followed by TypeScript and production-build verification.

## Scope

No database schema, RLS policy, workflow behavior, Docker configuration, routing layer, or authenticated dashboard UI will change. Provider enablement and redirect allow-listing are external Supabase/Google configuration steps, not repository secrets.
