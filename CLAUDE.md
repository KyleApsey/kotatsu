# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A shared household cleaning tracker web app for two users (real-time sync). Either user opens the app on their phone, sees what tasks remain for today/this week/this month, checks them off, and the other user's view updates immediately.

Plans and design docs are in `~/.gstack/projects/cleaning_schedule/`.

## Tech Stack

- **Frontend**: Nuxt.js + Vue.js (Options API only — never Composition API)
- **Styles**: Dart Sass — per-component `.scss` files; global utilities (`_variables.scss`, `_mixins.scss`) via `@use` only, never `additionalData`; `assets/styles/utilities/_index.scss` uses `@forward` as the single import target
- **Backend**: Supabase (Postgres + Realtime subscriptions + magic-link auth)
- **Hosting**: Vercel (auto-deploy on push to main)
- **PWA**: `@vite-pwa/nuxt`, `display: standalone`

## Key Architecture Rules

- Vue components: **Options API only** — never `<script setup>` or `defineComponent` with Composition API
- Component styles: each `.vue` file has a dedicated `.scss` in `assets/styles/components/`; no `<style>` blocks in `.vue` files
- Sass imports: each component stylesheet does `@use '../utilities' as *` (or the path to `_index.scss`) — never global injection via `nuxt.config` `additionalData`
- Dark mode: CSS custom properties (`--color-bg`, etc.) with `@media (prefers-color-scheme: dark)` override — not Sass compile-time variables

## Data Model

```
tasks: id, label, frequency (daily/weekly/monthly/quarterly), category (default 'Cleaning'),
       group_name, day_of_week (ISO 8601: 1=Mon…7=Sun), time_of_day ('morning'|'evening'|null),
       sort_order (int), archived_at (timestamptz, null = active), category_version (int, default 0)

completions: id, task_id (FK), completed_at (timestamptz), completed_by (text), period_key (text)
             UNIQUE(task_id, period_key)

push_subscriptions: id, endpoint (UNIQUE), p256dh, auth, user_email, created_at
```

## period_key Format

| Frequency | Format | Example |
|-----------|--------|---------|
| daily morning | `YYYY-MM-DD-morning` | `2026-06-10-morning` |
| daily evening | `YYYY-MM-DD-evening` | `2026-06-10-evening` |
| weekly | `YYYY-Www` | `2026-W24` |
| monthly | `YYYY-MM` | `2026-06` |
| quarterly | `YYYY-QN` | `2026-Q2` |

`usePeriodKey(task, now)` computes the key using `task.frequency` + `task.time_of_day` + local `Date`. Always use `Intl.DateTimeFormat` with an explicit IANA timezone (e.g., `America/Detroit`) — not `Date.getFullYear()` / `Date.getMonth()`.

## Project Structure (Nuxt 4)

Nuxt 4 uses an `app/` source directory:

```
app/
  components/          # TaskRow, TaskGroup, TaskEditForm, TabNav, AllDoneBanner
  composables/         # useTasks.js, useTaskAdmin.js, usePeriodKey.js, useStreak.js
  pages/               # index.vue (home), login.vue, confirm.vue (PKCE callback), manage.vue
  plugins/             # push-subscription.client.js (registers SW push on login)
  service-worker/      # sw.js (injectManifest strategy)
  types/               # database.types.ts (generated via supabase gen types typescript)
  assets/styles/       # utilities/ (_variables.scss, _reset.scss, _index.scss)
supabase/
  functions/           # send-evening-reminders/ (Deno Edge Function)
  seed.sql             # one-time task seed
tests/                 # Vitest test suite (see Testing section)
```

## Key Composables

**`useTasks()`** — Supabase data + Realtime subscriptions for a page.
- Returns `{ tasks, completions, loading, cleanup }`.
- Both Realtime channels use `makeQueueGuard(fn)` to coalesce burst events into at-most one pending refetch.
- `makeQueueGuard(fn)` is exported as a pure function for unit testing.
- `completions` fetches the last 365 days to support streak calculations without capping them.

**`useTaskAdmin()`** — Mutations (add, update, archive, reorder, rename category).
- Internally calls `createTaskAdmin(supabase)` factory for testability.
- `createTaskAdmin(supabase)` is exported as a pure factory for unit testing without Nuxt runtime.
- `renameCategory(oldName, newName, categoryVersion)` uses optimistic locking via `category_version` to prevent concurrent renames from stomping each other.

**`usePeriodKey(task, now)`** — Computes the `period_key` string for a task at a given time.
- Always uses `Intl.DateTimeFormat` with `NUXT_PUBLIC_HOUSEHOLD_TZ` — never `Date.getFullYear()` etc.

**`useStreak()`** — Computes the current daily morning streak from completions history.

## Supabase Notes

- RLS is enabled on all three tables
- Email allowlist via RLS policy: `auth.email() IN ('kapseydev@gmail.com', 'hengy.brooke@gmail.com')`
- Edge Functions use `SUPABASE_SECRET_KEY` (auto-injected by Supabase runtime) to bypass RLS — never expose this in client env vars
- `VAPID_PRIVATE_KEY` must be a Supabase project secret (`supabase secrets set`) — never in `.env` or Vercel env vars
- Realtime: `supabase.channel('name').on('postgres_changes', ...)` — use this API, not the deprecated `.from().on()`
- Auth flow: PKCE magic-link → `/confirm?code=…` → `supabase.auth.exchangeCodeForSession(code)` → redirect to `/`

## Testing

```bash
npm test          # run all 68 tests
npm run test:watch
```

**Test environment:** Vitest + `happy-dom`. Do NOT use `@nuxt/test-utils` `nuxt` environment — it conflicts with `@vite-pwa/nuxt` and hangs.

**Patterns:**

- **Pure factory extraction** — composables that call Supabase auto-imports are tested by exporting a factory (`createTaskAdmin(supabase)`, `makeQueueGuard(fn)`) and passing a mock client. The `use*()` wrapper calls the factory with `useSupabaseClient()`.
- **Methods-in-isolation** — Vue Options API computed/methods are tested via `.call()` on plain objects without mounting. See `tests/ManagePage.test.js`.
- **Teleport stub** — Components using `<teleport to="body">` need `global: { stubs: { teleport: { template: '<div><slot /></div>' } } }` in mount options to render inline.

Test files live in `tests/` (not co-located):
| File | What it tests |
|------|--------------|
| `usePeriodKey.test.js` | period_key computation for all frequencies |
| `useStreak.test.js` | streak calculation logic |
| `TaskRow.test.js` | optimistic check/uncheck, last-done display |
| `groupTasksByFrequency.test.js` | grouping helper |
| `useTaskAdmin.test.js` | add/archive/rename mutations via mock Supabase |
| `TaskEditForm.test.js` | form rendering, pre-population, onSave callback |
| `useTasks.test.js` | makeQueueGuard burst-protection behavior |
| `ManagePage.test.js` | sections computed, filteredTasks, confirmArchive methods |

## Design System

`DESIGN.md` — the canonical design reference. All component stylesheets are calibrated against it. Key constraints: Geist font, near-monochrome palette (#F5F5F0 bg / #2C2C2C checked), muted sage (#5A7A5A) only for "All Done" state, no decorative shadows or motion.

## Task Data Source

`raw_breakdown.md` — the canonical task list. Step 11 of the implementation sequence seeds the database from this file via a one-time Node script.

## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel
- Production URL: https://kotatsu-alpha.vercel.app/
- Deploy workflow: auto-deploy on push to `main`
- Project type: web app (Nuxt 4 PWA)
- Post-deploy health check: https://kotatsu-alpha.vercel.app/

### Custom deploy hooks
- Pre-merge: `npm test -- --run` (verify 68/68 tests pass)
- Deploy trigger: automatic on push to main (Vercel GitHub integration)
- Deploy status: poll https://kotatsu-alpha.vercel.app/ until HTTP 302 (auth redirect = app is up)
- Health check: HTTP 302 from / is the expected healthy response (app redirects unauthenticated requests to /login)
