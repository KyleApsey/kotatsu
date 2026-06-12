# TODOS

## T1 — Batch sort_order writes in drag-to-reorder

**What:** Replace N individual `updateSortOrder` calls with a single `update_sort_orders(p_ids, p_orders)` RPC that updates all rows in one DB roundtrip.

**Why:** Each drag fires one UPDATE per task in the section. For a 15-task section that's 15 parallel writes, 15 Realtime events, and potential Supabase free-tier rate limiting. The queue guard reduces to 2 `fetchTasks` calls, but the write storm still happens.

**How to apply:** Create a Supabase migration with a PL/pgSQL function accepting `int[]` and `int[]`. Update `useTaskAdmin.updateSortOrder` to call it. Update `manage.vue` `onTouchEnd` to call the batch version.

**Depends on:** None.

---

## T2 — Drag-to-reorder blocks iOS page scroll (ISSUE-003)

**What:** `manage-row` has `touch-action: none` in CSS, which tells iOS Safari to hand all touch events to JS rather than use them for native page scrolling. When a task list is longer than the viewport, users cannot scroll by touching task rows — only section headers and the "Add task" buttons remain scrollable.

**Why:** The drag implementation requires `touch-action: none` to prevent iOS from capturing vertical swipes for scroll before JS can handle them. But this makes all rows non-scrollable even when the user isn't dragging.

**How to apply:** Redesign the drag activation model to use a long-press threshold (e.g. 300ms `touchstart` delay sets drag mode, enabling `touch-action: none` dynamically via inline style). Until then, short task lists (≤8 per section) are not affected in practice.

**Severity:** Medium — blocked by UX tradeoff in the current drag implementation. Practical impact minimal for a 2-user household with short lists.

**Depends on:** T1 (can refactor both drag behaviors together).

---

## T3 — Verify Supabase Redirect URL configuration

**What:** In Supabase Dashboard → Authentication → URL Configuration, ensure:
- **Site URL** = `https://kotatsu-alpha.vercel.app`
- **Redirect URLs** includes `http://localhost:3000/**` (for local dev)

**Why:** `signInWithOtp` sends the magic link with `emailRedirectTo = ${window.location.origin}/confirm`. If that URL is not in Supabase's allowlist, Supabase silently falls back to the Site URL. If the Site URL is `http://localhost:3000`, all production magic link emails redirect to localhost — login completely broken in production. The OTP API returns `{}` success either way, so there's no code signal when misconfigured.

**How to apply:** Log into Supabase dashboard → project `vwoyyvkjpdwyvpwphntz` → Authentication → URL Configuration. Add both URLs. No code change needed.

**Depends on:** None. Do this before testing the Bug B fix.
