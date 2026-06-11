function getLocalDateString(date, tz) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date) // 'YYYY-MM-DD'
}

function getISOWeekKey(date, tz) {
  const localStr = getLocalDateString(date, tz)
  const [year, month, day] = localStr.split('-').map(Number)
  // Work in UTC to avoid local system timezone interference
  const d = new Date(Date.UTC(year, month - 1, day))
  const dow = d.getUTCDay() || 7 // ISO: Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dow) // shift to Thursday of this ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

// Pure function — no Nuxt dependency, fully testable
export function computePeriodKey(task, now, tz) {
  const localDate = getLocalDateString(now, tz)

  if (task.frequency === 'daily') {
    return `${localDate}-${task.time_of_day}`
  }
  if (task.frequency === 'weekly') {
    return getISOWeekKey(now, tz)
  }
  if (task.frequency === 'monthly') {
    return localDate.slice(0, 7) // 'YYYY-MM'
  }
  if (task.frequency === 'quarterly') {
    const year = localDate.slice(0, 4)
    const month = parseInt(localDate.slice(5, 7))
    return `${year}-Q${Math.ceil(month / 3)}`
  }
}

export function usePeriodKey(task, now) {
  const tz = useRuntimeConfig().public.householdTz || 'America/Detroit'
  return computePeriodKey(task, now, tz)
}
