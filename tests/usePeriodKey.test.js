import { describe, it, expect } from 'vitest'
import { computePeriodKey } from '../app/composables/usePeriodKey.js'

const TZ = 'America/Detroit'
// 2026-06-10 (Wednesday) at noon EDT = 16:00 UTC
const NOW = new Date('2026-06-10T16:00:00Z')

describe('computePeriodKey', () => {
  describe('daily', () => {
    it('returns local date + morning', () => {
      expect(computePeriodKey({ frequency: 'daily', time_of_day: 'morning' }, NOW, TZ))
        .toBe('2026-06-10-morning')
    })

    it('returns local date + evening', () => {
      expect(computePeriodKey({ frequency: 'daily', time_of_day: 'evening' }, NOW, TZ))
        .toBe('2026-06-10-evening')
    })

    it('uses local date not UTC (11pm EDT = 3am UTC next day is still same local day)', () => {
      // 03:00 UTC on Jun 11 = 23:00 EDT on Jun 10 — should still be Jun 10 locally
      const lateNight = new Date('2026-06-11T03:00:00Z')
      expect(computePeriodKey({ frequency: 'daily', time_of_day: 'evening' }, lateNight, TZ))
        .toBe('2026-06-10-evening')
    })
  })

  describe('weekly', () => {
    it('returns ISO week key for 2026-06-10 (week 24)', () => {
      expect(computePeriodKey({ frequency: 'weekly' }, NOW, TZ)).toBe('2026-W24')
    })

    it('ISO week key format is YYYY-Www', () => {
      const key = computePeriodKey({ frequency: 'weekly' }, NOW, TZ)
      expect(key).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('monthly', () => {
    it('returns YYYY-MM', () => {
      expect(computePeriodKey({ frequency: 'monthly' }, NOW, TZ)).toBe('2026-06')
    })
  })

  describe('quarterly', () => {
    it('Q1 — January', () => {
      const jan = new Date('2026-01-15T16:00:00Z')
      expect(computePeriodKey({ frequency: 'quarterly' }, jan, TZ)).toBe('2026-Q1')
    })

    it('Q2 — June', () => {
      expect(computePeriodKey({ frequency: 'quarterly' }, NOW, TZ)).toBe('2026-Q2')
    })

    it('Q3 — August', () => {
      const aug = new Date('2026-08-01T16:00:00Z')
      expect(computePeriodKey({ frequency: 'quarterly' }, aug, TZ)).toBe('2026-Q3')
    })

    it('Q4 — November', () => {
      // Nov 1 17:00 UTC = Nov 1 12:00 EST (UTC-5)
      const nov = new Date('2026-11-01T17:00:00Z')
      expect(computePeriodKey({ frequency: 'quarterly' }, nov, TZ)).toBe('2026-Q4')
    })
  })
})
