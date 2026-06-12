import { describe, it, expect } from 'vitest'
import { computeDueDate } from '../app/composables/useDueDate.js'

const TZ = 'America/Detroit'
// 2026-06-10 (Wednesday, ISO DOW=3) at noon EDT = 16:00 UTC
const NOW = new Date('2026-06-10T16:00:00Z')

describe('computeDueDate', () => {
  describe('non-weekly, non-want frequencies', () => {
    it('returns null for daily', () => {
      expect(computeDueDate({ frequency: 'daily', time_of_day: 'morning' }, NOW, TZ)).toBeNull()
    })

    it('returns null for monthly', () => {
      expect(computeDueDate({ frequency: 'monthly' }, NOW, TZ)).toBeNull()
    })

    it('returns null for quarterly', () => {
      expect(computeDueDate({ frequency: 'quarterly' }, NOW, TZ)).toBeNull()
    })
  })

  describe('weekly', () => {
    it('returns null when day_of_week is null', () => {
      expect(computeDueDate({ frequency: 'weekly', day_of_week: null }, NOW, TZ)).toBeNull()
    })

    it('returns not-overdue label when due day is today (Wednesday=3)', () => {
      const result = computeDueDate({ frequency: 'weekly', day_of_week: 3 }, NOW, TZ)
      expect(result).toEqual({ label: 'Due Wednesday', overdue: false })
    })

    it('returns overdue when due day has already passed this week (Mon=1, today=Wed)', () => {
      const result = computeDueDate({ frequency: 'weekly', day_of_week: 1 }, NOW, TZ)
      expect(result).toEqual({ label: 'Due Monday', overdue: true })
    })

    it('returns not-overdue when due day is upcoming this week (Fri=5, today=Wed)', () => {
      const result = computeDueDate({ frequency: 'weekly', day_of_week: 5 }, NOW, TZ)
      expect(result).toEqual({ label: 'Due Friday', overdue: false })
    })

    it('returns not-overdue when due day is Sunday (7, today=Wed=3)', () => {
      const result = computeDueDate({ frequency: 'weekly', day_of_week: 7 }, NOW, TZ)
      expect(result).toEqual({ label: 'Due Sunday', overdue: false })
    })

    it('returns overdue on Sunday (DOW=7) for a Saturday task (6)', () => {
      // Sunday = ISO DOW 7, Saturday = ISO DOW 6, 7 > 6 → overdue
      const sunday = new Date('2026-06-14T16:00:00Z') // Sunday June 14
      const result = computeDueDate({ frequency: 'weekly', day_of_week: 6 }, sunday, TZ)
      expect(result).toEqual({ label: 'Due Saturday', overdue: true })
    })

    it('includes correct label for all days', () => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      days.forEach((name, i) => {
        const result = computeDueDate({ frequency: 'weekly', day_of_week: i + 1 }, NOW, TZ)
        expect(result.label).toBe(`Due ${name}`)
      })
    })
  })

  describe('want', () => {
    it('returns null when target_date is not set', () => {
      expect(computeDueDate({ frequency: 'want', target_date: null }, NOW, TZ)).toBeNull()
      expect(computeDueDate({ frequency: 'want' }, NOW, TZ)).toBeNull()
    })

    it('returns not-overdue with formatted label for a future target_date', () => {
      const result = computeDueDate({ frequency: 'want', target_date: '2026-06-30' }, NOW, TZ)
      expect(result).toEqual({ label: 'by Jun 30', overdue: false })
    })

    it('returns overdue with formatted label for a past target_date', () => {
      const result = computeDueDate({ frequency: 'want', target_date: '2026-06-05' }, NOW, TZ)
      expect(result).toEqual({ label: 'by Jun 5', overdue: true })
    })

    it('returns not-overdue when target_date is today', () => {
      const result = computeDueDate({ frequency: 'want', target_date: '2026-06-10' }, NOW, TZ)
      expect(result).toEqual({ label: 'by Jun 10', overdue: false })
    })

    it('formats the month correctly in the label', () => {
      const result = computeDueDate({ frequency: 'want', target_date: '2026-12-25' }, NOW, TZ)
      expect(result.label).toBe('by Dec 25')
    })
  })
})
