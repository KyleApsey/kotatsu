import { getLocalDateString } from './usePeriodKey.js'

// Shared loop: counts consecutive days (including or starting from yesterday)
// isDayComplete receives a 'YYYY-MM-DD' string and returns boolean
function countConsecutiveDays(isDayComplete, now, tz) {
  const startDaysAgo = isDayComplete(getLocalDateString(now, tz)) ? 0 : 1
  let streak = 0
  for (let i = startDaysAgo; i < 3650; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (!isDayComplete(getLocalDateString(d, tz))) break
    streak++
  }
  return streak
}

// Pure function — no Nuxt dependency, fully testable
export function computeStreak(tasks, completions, now, tz) {
  const dailyTasks = tasks.filter(t => t.frequency === 'daily')
  if (!dailyTasks.length) return 0

  const morningTasks = dailyTasks.filter(t => t.time_of_day === 'morning')
  const eveningTasks = dailyTasks.filter(t => t.time_of_day === 'evening')

  const completedSet = new Set(
    completions.map(c => `${c.task_id}|${c.period_key}`)
  )

  function isDayComplete(dateStr) {
    const morningKey = `${dateStr}-morning`
    const eveningKey = `${dateStr}-evening`
    const morningDone = !morningTasks.length ||
      morningTasks.every(t => completedSet.has(`${t.id}|${morningKey}`))
    const eveningDone = !eveningTasks.length ||
      eveningTasks.every(t => completedSet.has(`${t.id}|${eveningKey}`))
    return morningDone && eveningDone
  }

  return countConsecutiveDays(isDayComplete, now, tz)
}

// Per-user streak: counts consecutive days where the user completed at least one
// daily task. Want completions (period_key='done') are excluded — they have no
// local date component and don't represent a specific day's effort.
export function computeStreakForUser(tasks, completions, userEmail, now, tz) {
  function isDayComplete(dateStr) {
    return completions.some(c =>
      c.completed_by === userEmail && c.period_key.startsWith(dateStr + '-')
    )
  }

  return countConsecutiveDays(isDayComplete, now, tz)
}

export function useStreak(tasks, completions) {
  return computed(() => {
    const tz = useRuntimeConfig().public.householdTz || 'America/Detroit'
    return computeStreak(tasks.value, completions.value, new Date(), tz)
  })
}
