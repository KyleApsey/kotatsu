import { describe, it, expect } from 'vitest'
import { groupTasksByFrequency } from '../app/composables/useTasks.js'

function task(overrides) {
  return { id: 1, label: 'Task', frequency: 'daily', time_of_day: 'morning', group_name: 'General', ...overrides }
}

describe('groupTasksByFrequency', () => {
  it('returns all-empty structure for empty input', () => {
    const result = groupTasksByFrequency([])
    expect(result.daily.morning).toEqual([])
    expect(result.daily.evening).toEqual([])
    expect(result.weekly).toEqual([])
    expect(result.monthly).toEqual([])
    expect(result.quarterly).toEqual([])
  })

  it('splits daily tasks into morning and evening', () => {
    const tasks = [
      task({ id: 1, time_of_day: 'morning' }),
      task({ id: 2, time_of_day: 'evening' }),
    ]
    const result = groupTasksByFrequency(tasks)
    expect(result.daily.morning[0].tasks).toHaveLength(1)
    expect(result.daily.morning[0].tasks[0].id).toBe(1)
    expect(result.daily.evening[0].tasks[0].id).toBe(2)
  })

  it('groups tasks by group_name within a frequency', () => {
    const tasks = [
      task({ id: 1, group_name: 'Kitchen' }),
      task({ id: 2, group_name: 'Kitchen' }),
      task({ id: 3, group_name: 'Bedroom' }),
    ]
    const result = groupTasksByFrequency(tasks)
    const groups = result.daily.morning
    expect(groups).toHaveLength(2)
    const kitchen = groups.find(g => g.name === 'Kitchen')
    expect(kitchen.tasks).toHaveLength(2)
    const bedroom = groups.find(g => g.name === 'Bedroom')
    expect(bedroom.tasks).toHaveLength(1)
  })

  it('uses "General" as default group_name when missing', () => {
    const tasks = [task({ id: 1, group_name: undefined })]
    const result = groupTasksByFrequency(tasks)
    expect(result.daily.morning[0].name).toBe('General')
  })

  it('places weekly/monthly/quarterly tasks in the correct bucket', () => {
    const tasks = [
      task({ id: 1, frequency: 'weekly', group_name: 'G' }),
      task({ id: 2, frequency: 'monthly', group_name: 'G' }),
      task({ id: 3, frequency: 'quarterly', group_name: 'G' }),
    ]
    const result = groupTasksByFrequency(tasks)
    expect(result.daily.morning).toHaveLength(0)
    expect(result.weekly[0].tasks[0].id).toBe(1)
    expect(result.monthly[0].tasks[0].id).toBe(2)
    expect(result.quarterly[0].tasks[0].id).toBe(3)
  })

  it('drops tasks with unknown frequency without throwing', () => {
    const tasks = [task({ id: 1, frequency: 'hourly' })]
    const result = groupTasksByFrequency(tasks)
    expect(result.daily.morning).toHaveLength(0)
    expect(result.weekly).toHaveLength(0)
  })
})
