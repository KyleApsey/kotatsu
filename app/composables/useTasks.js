export function groupTasksByFrequency(tasks) {
  const result = {
    daily: { morning: [], evening: [] },
    weekly: [],
    monthly: [],
    quarterly: [],
  }

  const dailyMorningGroups = {}
  const dailyEveningGroups = {}
  const otherGroups = { weekly: {}, monthly: {}, quarterly: {} }

  for (const task of tasks) {
    const groupName = task.group_name || 'General'

    if (task.frequency === 'daily') {
      const slot = task.time_of_day === 'evening' ? dailyEveningGroups : dailyMorningGroups
      if (!slot[groupName]) slot[groupName] = []
      slot[groupName].push(task)
    } else if (task.frequency in otherGroups) {
      if (!otherGroups[task.frequency][groupName]) otherGroups[task.frequency][groupName] = []
      otherGroups[task.frequency][groupName].push(task)
    }
  }

  result.daily.morning = Object.entries(dailyMorningGroups).map(([name, tasks]) => ({ name, tasks }))
  result.daily.evening = Object.entries(dailyEveningGroups).map(([name, tasks]) => ({ name, tasks }))
  result.weekly = Object.entries(otherGroups.weekly).map(([name, tasks]) => ({ name, tasks }))
  result.monthly = Object.entries(otherGroups.monthly).map(([name, tasks]) => ({ name, tasks }))
  result.quarterly = Object.entries(otherGroups.quarterly).map(([name, tasks]) => ({ name, tasks }))

  return result
}

export function useTasks() {
  const tasks = ref([])
  const completions = ref([])
  const loading = ref(true)

  const supabase = useSupabaseClient()

  let fetchInProgress = false
  let pendingRefetch = false

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
    tasks.value = data || []
  }

  async function fetchCompletions() {
    const { data } = await supabase
      .from('completions')
      .select('*')
      .order('completed_at', { ascending: false })
    completions.value = data || []
  }

  async function handleTaskChange() {
    if (fetchInProgress) { pendingRefetch = true; return }
    fetchInProgress = true
    await fetchTasks()
    fetchInProgress = false
    if (pendingRefetch) { pendingRefetch = false; handleTaskChange() }
  }

  async function init() {
    loading.value = true
    await Promise.all([fetchTasks(), fetchCompletions()])
    loading.value = false
  }

  const uid = Math.random().toString(36).slice(2, 8)

  const completionsChannel = supabase
    .channel(`completions-${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, fetchCompletions)
    .subscribe()

  const tasksChannel = supabase
    .channel(`tasks-${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleTaskChange)
    .subscribe()

  function cleanup() {
    supabase.removeChannel(completionsChannel)
    supabase.removeChannel(tasksChannel)
  }

  init()

  return { tasks, completions, loading, cleanup }
}
