# React, TypeScript, and Tailwind Migration Design

## Goal

Migrate the existing SproutOps Vite application from imperative JavaScript and inline CSS to React, strict TypeScript, and Tailwind CSS while preserving all authentication, video, checklist, editing, comment, and Supabase behavior. The database schema and migrations remain unchanged.

## Scope

The migration changes only the browser application and its tests. It retains the existing Vite app root, environment variables, Supabase client configuration, optimistic checklist updates, stale-write protection, workflow ordering, editing operations, authentication callback handling, responsive behavior, and production output location.

The UI may receive small presentation improvements for legibility: consistent spacing, clearer hierarchy, simpler cards, restrained color use, and responsive layouts. No feature, workflow, label, user action, or database operation is added or removed.

## Architecture

The existing pure workflow rules and Supabase service functions become typed TypeScript modules. React components replace HTML string builders, while focused hooks own session state, video loading and mutations, editing details, and transient UI state. React local state is sufficient; no routing or third-party state-management package is introduced.

The application is divided into:

- `App` for the authenticated/unauthenticated application boundary.
- `useAuth` for initial session restoration and auth-state subscriptions.
- `useVideos` for video loading, CRUD operations, optimistic checklist mutations, rollback, and per-video errors.
- Focused presentation components for the header, login screen, video list/card, workflow sections, editing details/comments, and new-video modal.
- Typed constants and services as the shared domain/data layer.

## Data Flow

On startup, the auth hook restores the Supabase session and subscribes to changes. Once authenticated, the video hook loads active videos. A checklist click immediately applies the existing `getChecklistUpdate` result to React state, persists `completed_actions`, `current_stage`, `next_action`, and `published_at` through the existing service, then replaces the optimistic row with the returned database row. A rejected or stale write restores the previous row and displays an inline error.

Editing status, review actions, and comments continue through the existing editing service and reload the relevant editing details after mutation. They do not derive or overwrite checklist state.

## Type Safety

TypeScript domain types define video stages, workflow action keys, editing statuses, video rows, edit versions, comments, profiles, and service payloads. The workflow constants use literal types so invalid action keys and stage names fail type checking. The Supabase client is parameterized with generated-compatible database types matching the current schema, including `completed_actions`.

Vite continues to transpile the app; a separate `tsc --noEmit` script performs strict type checking and is included in the production build command.

## Tailwind and Visual Treatment

Tailwind CSS is integrated with its Vite plugin. A small stylesheet imports Tailwind and defines the existing SproutOps color, radius, shadow, font, and focus tokens. Components use readable utility classes directly. Custom CSS is limited to global defaults and behavior that is clearer as CSS, such as the loading shimmer.

The visual result keeps the current identity and responsive structure. Cards use less nested decoration, headings and metadata have stronger hierarchy, workflow rows remain large click targets, errors remain adjacent to their action, and mobile controls retain the current floating new-video action.

## Authentication and Supabase

The browser Supabase client retains `persistSession`, `autoRefreshToken`, and `detectSessionInUrl`. The existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables remain supported. No service-role credential is introduced, no RLS policy changes are made, and no SQL or migration file is modified.

Auth subscriptions are cleaned up when React unmounts. Sign-out clears video and editing state. Magic-link callbacks continue to resolve in the same browser window through Supabase URL session detection and the existing redirect construction.

## Error Handling and Accessibility

Loading, empty, authentication, and database-error states preserve their current messages and retry actions. Mutations disable only the affected controls while pending. Dialog semantics, form labels, keyboard Escape handling, focus placement, checkbox labels, button types, and `aria-expanded` state are retained or strengthened during component conversion.

## Testing and Verification

Pure workflow and service behavior remain covered by Vitest. DOM-string and HTML-structure assertions are replaced with React Testing Library interaction tests where appropriate. Required regression cases include authentication states, arbitrary checklist check/uncheck behavior, first-unchecked Stage and Up Next derivation, optimistic rollback, editing status/comments, modal interaction, and responsive control classes.

Completion requires:

- All Vitest suites passing.
- All retained shell regression tests passing or being replaced by equivalent component tests.
- Strict TypeScript checking passing.
- A successful production build.
- A read-only Supabase integration check against the unchanged database.
- Manual HTTP verification of the production preview.

## Non-Goals

- Database or migration changes.
- A new router, state manager, component library, or server framework.
- Changes to workflow semantics or editing business rules.
- A broad brand redesign.
- New application features.
