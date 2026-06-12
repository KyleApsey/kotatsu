# DESIGN.md — Household Cleaning Tracker

## Design Philosophy

**"A good tool disappears."**

This app has one job: when you open it, you know what's left to do. When you're done, it confirms it. Then you close it and forget it exists until next time. Every design decision is judged against this. If a feature, color, motion, or element draws attention to itself, it fails.

Reference: **Things 3** for warmth and intentionality (every pixel earned). **Linear** for density and zero noise. The result: a household tool that feels as considered as premium software — not a to-do app, not a dashboard. A tool.

**What this is not:**
- Not a productivity system (no stats, no streaks on the home screen)
- Not a wellness app (no confetti, no "great job!" copy)
- Not a team app (2 people, zero management overhead)
- Not a showcase (no animations that show off, no gradients, no decorative shadows)

---

## Color Palette

### CSS Custom Properties (canonical definition in `assets/styles/utilities/_variables.scss`)

```scss
:root {
  // Backgrounds
  --color-bg:          #F7F6F1;  // warm off-white (approved: Variant B warmth)
  --color-surface:     #FDFCF9;  // card/group surfaces (slightly warm, not pure white)
  --color-surface-alt: #F7F6F1;  // group header, secondary surfaces

  // Text
  --color-text-primary:   #1A1A1A;  // task labels, headings
  --color-text-secondary: #666666;  // dates, group names, fractions
  --color-text-tertiary:  #999999;  // initials, metadata
  --color-text-done:      #AAAAAA;  // checked task label

  // Borders
  --color-border:       #E0E0DC;  // card outlines, row dividers
  --color-border-light: #EEEEEB;  // row dividers inside cards

  // Interactive
  --color-checked:      #2C2C2C;  // filled checkbox, progress bar fill
  --color-checkbox-border: #C0C0BC;  // unchecked checkbox outline
  --color-progress-track: #E5E5E2;  // progress bar background

  // Special: only used for "All done" state — the one moment of color
  --color-done-accent:  #5A7A5A;  // muted sage — earned, not decorative
  --color-done-bg:      #F0F5F0;  // subtle green tint on all-done banner

  // Tap / active states
  --color-tap:          #F0F0EB;  // row tap feedback (barely visible)
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:          #1A1A1A;  // deep charcoal — not pure black
    --color-surface:     #242424;
    --color-surface-alt: #1E1E1E;

    --color-text-primary:   #F0F0EC;
    --color-text-secondary: #888888;
    --color-text-tertiary:  #606060;
    --color-text-done:      #555555;

    --color-border:       #333333;
    --color-border-light: #2A2A2A;

    --color-checked:      #D0D0CC;  // light on dark for filled state
    --color-checkbox-border: #555555;
    --color-progress-track: #333333;

    --color-done-accent:  #7A9A7A;  // slightly brighter sage for dark
    --color-done-bg:      #1E2A1E;

    --color-tap:          #2A2A2A;
  }
}
```

## Progress Framing

**Header shows "N left" not "N/total done."**

The user asks "what's still left?" not "how much have I done?" When N=0, the count disappears entirely and the All Done banner replaces it. This is forward-looking framing — non-judgmental, action-oriented.

- 1 task left: `"1 left today"`
- 3 tasks left: `"3 left today"` (tab = Today) / `"3 left this week"` (tab = Week)
- All done: count hidden; All Done banner shows instead

**Rule:** These are the only colors used in the entire app. No additional colors are introduced for components or states. If a new component needs color, extend this list — don't hardcode values in component stylesheets.

---

## Typography

**Font:** `'Geist', -apple-system, BlinkMacSystemFont, sans-serif`

Load via `@vercel/font` or CDN. Fallback to system sans-serif if Geist fails.

### Type Scale

| Token | Size | Weight | Transform | Use |
|-------|------|--------|-----------|-----|
| `--type-app-title` | 20px | 700 | — | App name in header |
| `--type-date` | 13px | 400 | — | Date subtitle in header |
| `--type-tab` | 14px | 500 | — | Tab nav labels |
| `--type-group-name` | 12px | 600 | UPPERCASE | Group header label |
| `--type-task` | 15px | 400 | — | Task label (default) |
| `--type-task-done` | 15px | 400 | — | Task label (checked) + line-through |
| `--type-meta` | 12px | 500 | — | Progress fraction ("2/3 done") |
| `--type-initials` | 11px | 500 | — | Checked-by initials |
| `--type-last-done` | 11px | 400 | — | "Last done: June 3" on monthly tasks |

Letter spacing: `--type-group-name` gets `letter-spacing: 0.5px`. Everything else: default.

Line height: tasks use `line-height: 1.3` for two-line task labels on mobile.

---

## Spacing

Base unit: **4px**

| Token | Value | Use |
|-------|-------|-----|
| `--space-xs` | 4px | Icon padding, tight gaps |
| `--space-sm` | 8px | Internal row gaps |
| `--space-md` | 12px | Card horizontal margins, row vertical padding |
| `--space-lg` | 16px | Header padding, group top margin |
| `--space-xl` | 24px | Section separation |

### Component-specific minimums
- Task row minimum height: **46px** (dense but still thumb-friendly; validated in Variant C)
- Checkbox size: **22×22px**
- Tab nav item: **10px top / 10px bottom** padding
- Group border-radius: **0** — full-bleed layout, no card outlines
- Checkbox border-radius: **4px**

---

## Component Patterns

### Checkbox
- Unchecked: 2px border, `--color-checkbox-border`, `--color-surface` background
- Checked: `--color-checked` fill, white checkmark
- Checkmark: CSS-drawn, 6×11px, rotated 45°
- **No animation on check.** Instant state change. The fill is the reward — don't dilute it with movement.

### Task Row
- Min-height **46px**, flex row, `--space-md` padding
- Separator: 1px `--color-border-light` bottom border (last row: none)
- Checked label: `text-decoration: line-through`, `--color-text-done`
- Initials badge: right-aligned, `--color-text-tertiary`, appears only when checked
- Tap state: `background: var(--color-tap)` — barely visible, confirms the tap registered

### Layout: Full-Bleed Groups

Groups use **no card borders and no border-radius** — full-bleed, edge to edge. Visual separation between groups comes from:
1. The group header's slightly different background (`--color-surface-alt`)
2. A 1px top border on each group header (`--color-border`)
3. 16px top margin between groups

This is Variant A's layout DNA. No card outlines. No rounded containers. The warmth comes from the background color and typography, not from visual chrome.

### Group Header
- Background: `--color-surface-alt`
- Bottom border: 1px `--color-border`
- Group name: `--type-group-name` in `--color-text-secondary`
- Progress fraction: `--type-meta` in `--color-text-secondary`; turns `--color-done-accent` when complete
- Streak (daily groups only): tiny "🔥 N days" next to fraction — text only, no icon if streak is 0

### Progress Bar
- Height: 4px
- Track: `--color-progress-track`
- Fill: `--color-checked`
- Border-radius: 2px
- Lives in the sticky header — shows aggregate today completion only
- **No animation on fill.** Width changes instantly.

### Tab Navigation
- Horizontal scroll, no scrollbar visible
- Active tab: `--color-text-primary`, 2px `--color-checked` bottom border
- Inactive tab: `--color-text-secondary`, no border
- No background change on active — the underline is the only signal

### All Done Banner
- Background: `--color-done-bg`
- Border: 1.5px dashed `--color-done-accent`
- Text: `--color-done-accent` (the only moment this color appears in context)
- Fade in over **200ms** — the one sanctioned animation
- Copy: "All done for today." / "You and [initial] finished everything." — plain, not congratulatory

### "Last Done" Stamp (monthly/quarterly tasks)
- Appears below the task label when a past completion exists
- Format: "Last done: [relative date]" — "Last done: 3 weeks ago" or "Last done: June 3"
- `--type-last-done`, `--color-text-tertiary`
- Not shown for daily/weekly tasks (recency is implicit)

---

## Interaction States

| Feature | Loading | Empty | Error | Success | Offline |
|---------|---------|-------|-------|---------|---------|
| Task list | Group headers visible immediately; task rows show 46px faint placeholder lines (`--color-border-light`) until data loads | "No tasks for this period." (shouldn't happen with seeded data) | Retry link below group: "Couldn't load — tap to retry" | Tasks appear instantly (no transition) | Cached tasks visible; tap-to-check shows brief error: "Can't sync — will retry when back online" |
| Checking a task | — | — | Row reverts to unchecked after re-fetch confirms failure; no error toast | Instant optimistic fill + strikethrough | Same as error path |
| Real-time update | — | — | — | Other user's check appears instantly (row fills, initials appear) | No update until reconnect |
| Progress header | Shows "—" or last-known count | "All done" if truly empty period | No special state | "N left" or "All done" | Shows last-known count |

**"Never done" stamp:** Monthly/quarterly tasks with no completion history show `"Never done"` in `--color-text-tertiary` instead of "Last done: X". Not alarming — just informational.

**Offline banner:** A thin 2px bar in `--color-border` at the very top of the app (above the header) with text "Offline — changes will sync when you reconnect" in `--color-text-tertiary` at 11px. Disappears when reconnected. Does NOT block interaction.

## Motion Philosophy

**"If it moves, it's lying about the work done."**

Motion should communicate real state transitions, not decoration.

| Element | Motion |
|---------|--------|
| Checkbox check | Instant — no transition |
| Task label strikethrough | Instant |
| Progress bar fill | Instant |
| All Done banner | Fade in 200ms, `ease-out` |
| Tab switch | Instant — no slide |
| Row tap feedback | Background flash, no duration |
| Real-time update (other user checks) | Instant — the Supabase event fires, React/Vue updates, done |

No spring physics. No bounce. No entrance animations on page load. Things are just there.

---

## Voice & Copy

- **No happy talk.** No "Wow, you're crushing it!" No "Let's get started." No "You've got this."
- **No instructions.** The interface is self-evident or it fails.
- **Terse, domestic.** "Make bed" not "Make Your Bed Each Morning." Group names are plain: "Morning", "Evening", "Kitchen (Wed)", "Monthly".
- **All Done copy:** "All done for today." (period, lowercase 'for', plain.) Second line: "You and [initial] finished everything." — acknowledges the partnership without performing it.
- **Error states:** Direct. "Couldn't save — tap to retry." Not "Oops! Something went wrong. Please try again."

---

## Responsive Behavior

### Phone (< 768px) — primary target
Full-width layout. Sticky header + horizontal tab nav + full-bleed groups. All specs in this document apply.

**Landscape phone:** Same 390px logical layout centered. No special breakpoint — the app just has extra dead space on the sides, which is fine.

### Tablet / iPad (≥ 768px)
Two-column layout:
- **Left panel (240px):** Vertical tab nav — Today / This Week / Monthly / Quarterly as stacked items with active state indicator
- **Right panel (flex: 1):** Task groups scrollable independently
- No bottom nav on tablet — the sidebar replaces it
- Max total width: 960px, centered

```
| Today      | MORNING          2/3 done |
| This Week  | Make bed             A    |
| Monthly    | Wipe counters        A    |
| Quarterly  | Load dishwasher           |
|            | EVENING          0/4 done |
|            | Clean kitchen counters    |
```

The left panel uses `--color-surface` with a 1px `--color-border` right border. Active tab is `--color-text-primary` with `--color-checked` left border (3px).

### Desktop (≥ 1280px)
Same as tablet layout, max-width 960px centered on `--color-bg`.

## Accessibility Minimums

- Touch targets: 46px minimum height on all interactive rows (exceeds WCAG 44px minimum)
- Color contrast: all text/background combinations meet WCAG AA (4.5:1 minimum)
- Do not rely on color alone to convey state — the checkbox shape + strikethrough are the primary signals; color is secondary
- Font size: 15px minimum for task labels (no smaller for body text on mobile)
- Dark mode: supported natively via `prefers-color-scheme` — not a user toggle

---

## What "AI Slop" Looks Like (and to avoid)

**Bottom nav — text only:** No icons in the bottom navigation. Labels only (Today / Week / Month / Qtr) with a 4px dot indicator under the active tab. Icons risk looking generic — text labels + the dot are sufficient affordance at this scale.

Actively reject these patterns:
- Hero section with a stock photo and a tagline
- Card grid with hover lift shadows
- Gradient backgrounds or gradient text
- Decorative shadows (box-shadow for aesthetics, not depth)
- Skeleton loading screens (optimistic UI means content is there immediately)
- Confetti or particle effects on completion
- Color that isn't in the defined palette
- Motion on elements that aren't transitioning state
- Empty states that say "No items yet! Get started by..." with a plus button

---

## Edge Cases & Resolved Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Header progress framing | "N left today" (not "N/total done") | Forward-looking; user asks "what's left?" |
| All done header state | Count disappears; banner replaces it | Count becomes meaningless at 0 |
| Sunday "Rest day" | Normal layout with fewer tasks | Small group reads as light day naturally |
| Monthly "never done" | "Never done" in tertiary color | Informational, not alarming |
| Bottom nav icons | Text labels only + dot indicator | Icons risk generic tab bar look |
| Tablet nav | Left sidebar (≥768px) | Replaces bottom nav; more comfortable on larger screen |
| Loading state | Faint placeholder rows (same height as real rows) | No layout shift; structure visible immediately |
| Offline state | Thin top bar + normal interaction (errors on check) | Non-blocking; doesn't prevent reading |
| Dark mode toggle | System preference only (`prefers-color-scheme`) — no manual toggle | Keeps the UI clean; phones already have this in Control Center |
| Group borders | None — full-bleed layout | Zero chrome; warmth from background color + header tint |
| Row height | 50px minimum (approved: B warmth) | Dense but thumb-friendly; slightly above original 46px spec |

## Design-Shotgun Brief

When running `/design-shotgun`, use this brief as the base constraint:

```
App: Household cleaning tracker PWA — two users, mobile-first, real-time sync.
Personality: Calm utility. Tools, not toys.
References: Things 3 (warmth, intentionality) + Linear (density, zero noise).
Font: Geist sans-serif.
Colors: Near-monochrome. Background #F5F5F0 (warm off-white), surface #FFF, text #1A1A1A, 
  checked state #2C2C2C. Accent color ONLY for "All done" state: muted sage #5A7A5A.
Dark mode: deep charcoal #1A1A1A background, NOT pure black.

Layout DNA (locked — do not deviate):
- Full-bleed groups: NO card borders, NO rounded corners on groups
- Groups separated only by spacing + group header background tint (#FAFAF8)
- Group headers: 1px top border, UPPERCASE label + completion fraction
- Task rows: 46px minimum height (dense but still tappable)
- Sticky header: app name + date + 4px progress bar
- Tab nav: horizontal scroll tabs below header

Screens to explore:
1. Today view — morning tasks partially done (2/3), evening untouched (0/4)
2. Today view — All Done state (the key moment — muted sage banner)
3. Weekly view — Wednesday kitchen focus tasks
4. Monthly view — tasks with "last done" timestamps (e.g. "Last done: 5 weeks ago")
5. Dark mode — Today view

Constraints:
- NO decorative shadows, gradients, or color accents beyond the palette
- Checkbox: 22px, left-aligned, dark fill when checked, white checkmark
- Initials badge: right-aligned, appears only on checked rows
- Progress bar: 4px, #2C2C2C fill on #E5E5E2 track
- All done: sage #5A7A5A border + text, #F0F5F0 background, "All done for today." copy
- Header shows "N left today" / "N left this week" / etc. — not "N/total done"
- Streak shown as "N days" text label in group header (morning group only), tertiary color
- "Never done" in tertiary for monthly/quarterly tasks with no completion history
```

## Implementation Tasks

Synthesized from /plan-design-review. Each task derives from a specific finding.

- [ ] **T1 (P1, human: ~30min / CC: ~5min)** — AppHeader — Render header as "N left today" not N/total done
  - Surfaced by: Pass 1 — progress framing is forward-looking
  - Files: `components/AppHeader.vue`, `assets/styles/components/AppHeader.scss`
  - Verify: Open app, confirm header reads "5 left today" when 2 of 7 tasks done

- [ ] **T2 (P2, human: ~1h / CC: ~10min)** — TaskGroup — Skeleton placeholder rows during initial Supabase fetch
  - Surfaced by: Pass 2 — loading state; 46px faint placeholder lines prevent layout shift
  - Files: `components/TaskGroup.vue`, `assets/styles/components/TaskGroup.scss`
  - Verify: Throttle network to Slow 3G, observe no layout shift when tasks load

- [ ] **T3 (P2, human: ~1h / CC: ~10min)** — OfflineBanner — Thin offline indicator + optimistic-check error handling
  - Surfaced by: Pass 2 — offline state; non-blocking 2px top bar when network unavailable
  - Files: `components/OfflineBanner.vue` (new), `assets/styles/components/OfflineBanner.scss`
  - Verify: Go offline in DevTools, check a task, confirm it reverts on failure

- [ ] **T4 (P3, human: ~3h / CC: ~20min)** — layout — Tablet sidebar layout (≥768px)
  - Surfaced by: Pass 6 — responsive; two-column layout on iPad replaces bottom nav
  - Files: `layouts/default.vue`, `assets/styles/templates/index.scss`
  - Verify: Open on iPad/iPad simulator, confirm sidebar nav replaces bottom tabs

### /manage Page Tasks (from 2026-06-11 design review)

- [x] **T5 (P1)** — manage.vue — `← Manage tasks` page header with back navigation ✓ DONE

- [x] **T6 (P1)** — manage.vue — 2-tap archive confirmation inline strip ✓ DONE

- [x] **T7 (P1)** — manage.vue — Category chip 2-step rename (tap → ✒ → rename) ✓ DONE

- [x] **T8 (P1)** — TaskEditForm.vue — Bottom sheet animation + accessibility ✓ DONE
  - 200ms enter / 150ms exit translateY ease-out/in implemented via Vue `<transition name="bottom-sheet">`
  - `role="dialog"` `aria-modal="true"` on sheet container
  - Note: full focus-trap (Tab cycling) not yet wired — Esc/Cancel closes via Cancel button

- [ ] **T9 (P2)** — manage.vue — Drag-in-progress visual (lifted row) — PARTIAL
  - Current: dragging row shows `opacity: 0.5`
  - Missing: `background: var(--color-tap)`, `box-shadow: 0 2px 8px rgba(0,0,0,0.10)`, 1px placeholder line at original position
  - Files: `pages/manage.vue`

- [ ] **T10 (P2)** — manage.vue — Group header count + empty group + full-page empty state — PARTIAL
  - Done: group header shows "N tasks" count ✓
  - Done: empty group shows header + "+ Add task" only ✓
  - Missing: full-page empty state message ("No tasks yet — tap + below to add your first.") when ALL groups have 0 tasks
  - Files: `pages/manage.vue`

- [ ] **T11 (P3, human: ~2h / CC: ~15min)** — manage.vue — Tablet layout: /manage in right panel
  - Surfaced by: Pass 6 — no tablet spec for /manage page
  - Spec: on ≥768px, manage.vue renders in the right panel; sidebar nav stays; gear icon in header navigates right panel only
  - Files: `pages/manage.vue`, `layouts/default.vue`, `assets/styles/templates/manage.scss`
  - Verify: Open on iPad, navigate to /manage, confirm sidebar stays and manage content fills right panel

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 2 | CLEAR | Run 2: 6 proposals, 6 accepted (task mgmt GUI), 2 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture + build review | 2 | CLEAR | Run 2 (post-build): 9 issues found and fixed — edge fn bugs (×3), completions window, makeQueueGuard exception safety, TaskEditForm error propagation, iOS drag, confirm.vue colors, category rename wiring, database.types.ts stub |
| Design Review | `/plan-design-review` | UI/UX gaps | 2 | CLEAR | Run 1: score 2/10 → 9/10, 8 decisions (main views); Run 2: score 3/10 → 9/10, 6 decisions (/manage page) |
| DX Review | `/plan-devex-review` | Developer experience | 0 | — | — |

**VERDICT:** CEO CLEARED (×2). Design CLEARED (×2). Eng CLEARED (×2). QA-ready.

**Open deferred items (TODOS.md):**
- T1: Batch sort_order writes (N individual RPCs → single `update_sort_orders` RPC)

**Pre-QA remaining design tasks:**
- T9: Drag lifted-row visual (opacity only; missing box-shadow + tap bg)
- T10: Full-page empty state message (group count + empty group done; missing all-tasks-archived state)
- T1-T4, T11: Deferred (tablet layout, skeleton rows, offline banner)

NO UNRESOLVED DECISIONS
