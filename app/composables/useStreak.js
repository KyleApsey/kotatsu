function getLocalDateStr(daysAgo, tz, now) {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
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

  // If today is fully complete, count from today; otherwise start from yesterday
  const startDaysAgo = isDayComplete(getLocalDateStr(0, tz, now)) ? 0 : 1

  let streak = 0
  for (let i = startDaysAgo; i < 3650; i++) {
    if (!isDayComplete(getLocalDateStr(i, tz, now))) break
    streak++
  }

  return streak
}

export function useStreak(tasks, completions) {
  return computed(() => {
    const tz = useRuntimeConfig().public.householdTz || 'America/Detroit'
    return computeStreak(tasks.value, completions.value, new Date(), tz)
  })
}
