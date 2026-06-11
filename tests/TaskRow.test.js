import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskRow from '../app/components/TaskRow.vue'

const task = { id: 1, label: 'Wash dishes', frequency: 'daily' }
const PERIOD_KEY = '2026-06-10-morning'

function makeCompletion(taskId = 1, periodKey = PERIOD_KEY) {
  return { task_id: taskId, period_key: periodKey, completed_by: 'user@example.com' }
}

describe('TaskRow', () => {
  describe('rendering', () => {
    it('renders unchecked when no matching completion', () => {
      const w = mount(TaskRow, {
        props: { task, completions: [], periodKey: PERIOD_KEY },
      })
      expect(w.find('.checkbox--checked').exists()).toBe(false)
      expect(w.find('.checkmark').exists()).toBe(false)
    })

    it('renders checked when a matching completion exists', () => {
      const w = mount(TaskRow, {
        props: { task, completions: [makeCompletion()], periodKey: PERIOD_KEY },
      })
      expect(w.find('.checkbox--checked').exists()).toBe(true)
      expect(w.find('.checkmark').exists()).toBe(true)
    })

    it('ignores completions for a different period_key', () => {
      const w = mount(TaskRow, {
        props: {
          task,
          completions: [makeCompletion(1, '2026-06-09-morning')],
          periodKey: PERIOD_KEY,
        },
      })
      expect(w.find('.checkbox--checked').exists()).toBe(false)
    })

    it('shows first-letter initials of the person who checked', () => {
      const w = mount(TaskRow, {
        props: { task, completions: [makeCompletion()], periodKey: PERIOD_KEY },
      })
      expect(w.find('.initials').text()).toBe('U') // 'user@example.com'[0].toUpperCase()
    })

    it('shows last-done label for monthly tasks', () => {
      const monthlyTask = { ...task, frequency: 'monthly' }
      const w = mount(TaskRow, {
        props: { task: monthlyTask, completions: [], periodKey: '2026-06' },
      })
      expect(w.find('.last-done').exists()).toBe(true)
      expect(w.find('.last-done').text()).toBe('Never done')
    })

    it('does not show last-done for daily tasks', () => {
      const w = mount(TaskRow, {
        props: { task, completions: [], periodKey: PERIOD_KEY },
      })
      expect(w.find('.last-done').exists()).toBe(false)
    })
  })

  describe('optimistic UI', () => {
    it('optimistically checks on click and emits check event', async () => {
      const w = mount(TaskRow, {
        props: { task, completions: [], periodKey: PERIOD_KEY },
      })
      await w.trigger('click')
      expect(w.find('.checkbox--checked').exists()).toBe(true)
      expect(w.emitted('check')).toBeTruthy()
      expect(w.emitted('check')[0][0]).toEqual(task)
    })

    it('optimistically unchecks on click and emits uncheck event', async () => {
      const w = mount(TaskRow, {
        props: { task, completions: [makeCompletion()], periodKey: PERIOD_KEY },
      })
      await w.trigger('click')
      expect(w.find('.checkbox--checked').exists()).toBe(false)
      expect(w.emitted('uncheck')).toBeTruthy()
      expect(w.emitted('uncheck')[0][0]).toEqual(task)
    })

    it('holds optimistic state before server responds', async () => {
      const w = mount(TaskRow, {
        props: { task, completions: [], periodKey: PERIOD_KEY },
      })
      await w.trigger('click')
      expect(w.vm.optimistic).toBe(true)
      // completions prop still empty — optimistic state holds the UI
      expect(w.find('.checkbox--checked').exists()).toBe(true)
    })

    it('clears optimistic state when server completion arrives', async () => {
      const w = mount(TaskRow, {
        props: { task, completions: [], periodKey: PERIOD_KEY },
      })
      await w.trigger('click')
      expect(w.vm.optimistic).toBe(true)

      await w.setProps({ completions: [makeCompletion()] })
      expect(w.vm.optimistic).toBe(null)
    })

    it('clears optimistic state when server removes completion', async () => {
      const w = mount(TaskRow, {
        props: { task, completions: [makeCompletion()], periodKey: PERIOD_KEY },
      })
      await w.trigger('click') // optimistic uncheck
      expect(w.vm.optimistic).toBe(false)

      await w.setProps({ completions: [] })
      expect(w.vm.optimistic).toBe(null)
    })
  })
})
