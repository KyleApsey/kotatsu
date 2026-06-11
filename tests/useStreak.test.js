import { describe, it, expect } from 'vitest'
import { computeStreak } from '../app/composables/useStreak.js'

const TZ = 'America/Detroit'
// Pin to 2026-06-10 noon EDT so date math is deterministic
const NOW = new Date('2026-06-10T16:00:00Z')

const morning = { id: 1, frequency: 'daily', time_of_day: 'morning' }
const evening = { id: 2, frequency: 'daily', time_of_day: 'evening' }

function done(taskId, dateStr, timeOfDay) {
  return { task_id: taskId, period_key: `${dateStr}-${timeOfDay}` }
}

describe('computeStreak', () => {
  it('returns 0 when there are no daily tasks', () => {
    expect(computeStreak([{ id: 1, frequency: 'weekly' }], [], NOW, TZ)).toBe(0)
  })

  it('returns 0 when today has no completions', () => {
    expect(computeStreak([morning], [], NOW, TZ)).toBe(0)
  })

  it('returns 1 when only today is complete', () => {
    expect(computeStreak(
      [morning],
      [done(1, '2026-06-10', 'morning')],
      NOW, TZ
    )).toBe(1)
  })

  it('counts consecutive days including today', () => {
    expect(computeStreak(
      [morning],
      [
        done(1, '2026-06-10', 'morning'),
        done(1, '2026-06-09', 'morning'),
        done(1, '2026-06-08', 'morning'),
      ],
      NOW, TZ
    )).toBe(3)
  })

  it('counts consecutive days from yesterday when today is not done', () => {
    expect(computeStreak(
      [morning],
      [
        done(1, '2026-06-09', 'morning'),
        done(1, '2026-06-08', 'morning'),
      ],
      NOW, TZ
    )).toBe(2)
  })

  it('breaks on a gap', () => {
    expect(computeStreak(
      [morning],
      [
        done(1, '2026-06-10', 'morning'),
        // gap on June 9
        done(1, '2026-06-08', 'morning'),
      ],
      NOW, TZ
    )).toBe(1)
  })

  it('requires both morning and evening tasks to be done', () => {
    expect(computeStreak(
      [morning, evening],
      [done(1, '2026-06-10', 'morning')], // evening task 2 missing
      NOW, TZ
    )).toBe(0)
  })

  it('counts full day when both morning and evening are done', () => {
    expect(computeStreak(
      [morning, evening],
      [
        done(1, '2026-06-10', 'morning'),
        done(2, '2026-06-10', 'evening'),
      ],
      NOW, TZ
    )).toBe(1)
  })

  it('morning-only list: evening not required', () => {
    expect(computeStreak(
      [morning], // no evening task in the list
      [done(1, '2026-06-10', 'morning')],
      NOW, TZ
    )).toBe(1)
  })

  it('evening-only list: morning not required', () => {
    expect(computeStreak(
      [evening],
      [done(2, '2026-06-10', 'evening')],
      NOW, TZ
    )).toBe(1)
  })
})
