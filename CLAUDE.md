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
       group_name, day_of_week (ISO 8601: 1=Mon…7=Sun), time_of_day ('morning'|'evening'|null), sort_order

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

## Supabase Notes

- RLS is enabled on all three tables; `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is in the migration
- Email allowlist via RLS policy: `auth.email() IN ('kapseydev@gmail.com', 'hengy.brooke@gmail.com')`
- Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) to bypass RLS
- Realtime: `supabase.channel('completions').on('postgres_changes', ...)` — use this API, not the deprecated `.from().on()`

## Design System

`DESIGN.md` — the canonical design reference. All component stylesheets are calibrated against it. Key constraints: Geist font, near-monochrome palette (#F5F5F0 bg / #2C2C2C checked), muted sage (#5A7A5A) only for "All Done" state, no decorative shadows or motion.

## Task Data Source

`raw_breakdown.md` — the canonical task list. Step 11 of the implementation sequence seeds the database from this file via a one-time Node script.
