# Kotatsu

Shared household cleaning tracker PWA for two users. Open it on your phone, see what's left to do today/this week/this month, check tasks off, and your partner's view updates immediately via Supabase Realtime.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Nuxt 4 + Vue 3 (Options API) |
| Styles | Dart Sass, per-component `.scss` files |
| Database | Supabase (Postgres + Realtime + Auth) |
| PWA | `@vite-pwa/nuxt`, `display: standalone` |
| Push notifications | Web Push API + Supabase Edge Function |
| Hosting | Vercel (auto-deploy on push to `main`) |
| CI | GitHub Actions — runs `npm test` on every push/PR |

## Prerequisites

- Node 20+
- A [Supabase](https://supabase.com) project
- Vercel account (for deployment)

## Local Setup

```bash
git clone <repo>
cd kotatsu
npm install
cp .env.example .env.local
# Fill in the values — see Environment Variables below
npm run dev
```

## Environment Variables

| Variable | Where to get it | Notes |
|----------|-----------------|-------|
| `NUXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | e.g. `https://xxxx.supabase.co` |
| `NUXT_PUBLIC_SUPABASE_KEY` | Supabase → Project Settings → API → `anon` key | Must be the publishable (`sb_publishable_*`) key |
| `NUXT_PUBLIC_HOUSEHOLD_TZ` | Your choice | IANA timezone, e.g. `America/Detroit` |
| `NUXT_PUBLIC_VAPID_PUBLIC_KEY` | Generate with `npx web-push generate-vapid-keys` | Public half only |

The VAPID private key and Supabase service role key are **never** in `.env` — they are Supabase project secrets set via `supabase secrets set`.

## Supabase Setup

### 1. Schema

The schema is managed via the Supabase dashboard or CLI. Tables:

```sql
tasks (id, label, frequency, category, group_name, time_of_day, day_of_week,
       sort_order, archived_at, category_version, created_at)

completions (id, task_id, period_key, completed_by, completed_at)
  UNIQUE(task_id, period_key)

push_subscriptions (id, endpoint, p256dh, auth, user_email, created_at)
  UNIQUE(endpoint)
```

RLS is enabled on all tables. Access is restricted to the two household email addresses via policy:
```sql
auth.email() IN ('kapseydev@gmail.com', 'hengy.brooke@gmail.com')
```

### 2. Seed

```bash
# From the Supabase dashboard: SQL Editor → paste supabase/seed.sql → Run
```

### 3. Edge Functions

The `send-evening-reminders` function fires push notifications for uncompleted evening tasks.

```bash
# Deploy
supabase functions deploy send-evening-reminders

# Set secrets (do NOT put these in .env)
supabase secrets set VAPID_PRIVATE_KEY=<your-private-key>
supabase secrets set VAPID_PUBLIC_KEY=<your-public-key>
supabase secrets set NUXT_PUBLIC_HOUSEHOLD_TZ=America/Detroit
# SUPABASE_SECRET_KEY is auto-injected by Supabase — no action needed
```

Schedule the function via a cron job in the Supabase dashboard (e.g. `0 20 * * *` for 8pm nightly).

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build locally
npm test             # Run Vitest test suite (68 tests)
npm run test:watch   # Watch mode
```

## Deployment

Push to `main` → Vercel auto-deploys. Set the four environment variables above in the Vercel dashboard under Project → Settings → Environment Variables.

## Design Reference

See `DESIGN.md` for the complete design system: color tokens, typography, spacing, component patterns, and interaction states.

## Architecture Notes

See `CLAUDE.md` for code conventions, data model details, and development patterns.
