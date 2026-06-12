# TODOS

## T1 — Batch sort_order writes in drag-to-reorder

**What:** Replace N individual `updateSortOrder` calls with a single `update_sort_orders(p_ids, p_orders)` RPC that updates all rows in one DB roundtrip.

**Why:** Each drag fires one UPDATE per task in the section. For a 15-task section that's 15 parallel writes, 15 Realtime events, and potential Supabase free-tier rate limiting. The queue guard reduces to 2 `fetchTasks` calls, but the write storm still happens.

**How to apply:** Create a Supabase migration with a PL/pgSQL function accepting `int[]` and `int[]`. Update `useTaskAdmin.updateSortOrder` to call it. Update `manage.vue` `onTouchEnd` to call the batch version.

**Depends on:** None.
