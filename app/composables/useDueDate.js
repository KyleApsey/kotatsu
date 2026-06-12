// day_of_week in DB: 1=Mon … 7=Sun (ISO)
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getLocalDateString(date, tz) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date) // 'YYYY-MM-DD'
}

function getIsoDow(date, tz) {
  const localStr = getLocalDateString(date, tz)
  const [year, month, day] = localStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCDay() || 7 // Sun(0) → 7, Mon(1) → 1 … Sat(6) → 6
}

function formatTargetDate(isoDateStr) {
  const [year, month, day] = isoDateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

// Pure function — no Nuxt dependency, fully testable
export function computeDueDate(task, now, tz) {
  if (task.frequency === 'weekly') {
    if (task.day_of_week == null) return null
    const todayDow = getIsoDow(now, tz)
    return {
      label: `Due ${DAY_NAMES[task.day_of_week]}`,
      overdue: todayDow > task.day_of_week,
    }
  }

  if (task.frequency === 'want') {
    if (!task.target_date) return null
    const todayStr = getLocalDateString(now, tz)
    return {
      label: `by ${formatTargetDate(task.target_date)}`,
      overdue: task.target_date < todayStr,
    }
  }

  return null
}

export function useDueDate(task, now) {
  const tz = useRuntimeConfig().public.householdTz || 'America/Detroit'
  return computeDueDate(task, now, tz)
}
