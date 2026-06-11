export function useTaskAdmin() {
  const supabase = useSupabaseClient()

  async function addTask({ label, frequency, time_of_day, day_of_week, category, group_name }) {
    const { data, error } = await supabase.rpc('add_task_with_sort_order', {
      p_label: label.trim(),
      p_frequency: frequency,
      p_time_of_day: time_of_day || null,
      p_day_of_week: day_of_week || null,
      p_category: category.trim() || 'Cleaning',
      p_group_name: group_name.trim() || 'General',
    })
    if (error) throw error
    return data
  }

  async function updateTask(id, { label, time_of_day, day_of_week, category, group_name }) {
    const { error } = await supabase
      .from('tasks')
      .update({
        label: label.trim(),
        time_of_day: time_of_day || null,
        day_of_week: day_of_week || null,
        category: category.trim() || 'Cleaning',
        group_name: group_name.trim() || 'General',
      })
      .eq('id', id)
    if (error) throw error
  }

  async function archiveTask(id) {
    const { error } = await supabase
      .from('tasks')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  async function updateSortOrder(taskId, newSortOrder) {
    const { error } = await supabase
      .from('tasks')
      .update({ sort_order: newSortOrder })
      .eq('id', taskId)
    if (error) throw error
  }

  async function renameCategory(oldName, newName, categoryVersion) {
    const { count, error } = await supabase
      .from('tasks')
      .update({ category: newName.trim(), category_version: categoryVersion + 1 })
      .eq('category', oldName)
      .eq('category_version', categoryVersion)
      .is('archived_at', null)
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    if (count === 0) throw new Error('Category was already renamed — refresh and try again.')
  }

  return { addTask, updateTask, archiveTask, updateSortOrder, renameCategory }
}
