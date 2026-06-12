import { describe, it, expect } from 'vitest'
// Test manage.vue component logic in isolation without mounting (avoids Supabase auto-import requirement)
import ManagePage from '../app/pages/manage.vue'

const { computed, methods, data: dataFn } = ManagePage

const task = (overrides) => ({
  id: 1, label: 'Wash dishes', frequency: 'daily', time_of_day: 'morning',
  category: 'Kitchen', group_name: 'Chores', sort_order: 1, ...overrides,
})

describe('ManagePage logic', () => {
  describe('confirmArchive', () => {
    it('sets archiveTarget to the tapped task', () => {
      const vm = { archiveTarget: null }
      methods.confirmArchive.call(vm, task({ id: 1 }))
      expect(vm.archiveTarget.id).toBe(1)
    })

    it('clears archiveTarget when the same task is tapped again (toggle off)', () => {
      const t = task({ id: 1 })
      const vm = { archiveTarget: t }
      methods.confirmArchive.call(vm, t)
      expect(vm.archiveTarget).toBe(null)
    })

    it('switches to a different task when a new one is tapped', () => {
      const vm = { archiveTarget: task({ id: 1 }) }
      methods.confirmArchive.call(vm, task({ id: 2 }))
      expect(vm.archiveTarget.id).toBe(2)
    })
  })

  describe('filteredTasks', () => {
    const tasks = [
      task({ id: 1, category: 'Kitchen' }),
      task({ id: 2, category: 'Bedroom' }),
      task({ id: 3, category: 'Kitchen' }),
    ]

    it('returns all tasks when no category filter is active', () => {
      const result = computed.filteredTasks.call({ tasks, activeCategory: null })
      expect(result).toHaveLength(3)
    })

    it('returns only tasks matching the active category', () => {
      const result = computed.filteredTasks.call({ tasks, activeCategory: 'Kitchen' })
      expect(result).toHaveLength(2)
      expect(result.every(t => t.category === 'Kitchen')).toBe(true)
    })
  })

  describe('categories', () => {
    it('returns unique sorted category names from tasks', () => {
      const tasks = [
        task({ category: 'Kitchen' }),
        task({ category: 'Bedroom' }),
        task({ category: 'Kitchen' }),
      ]
      const result = computed.categories.call({ tasks })
      expect(result).toEqual(['Bedroom', 'Kitchen'])
    })

    it('excludes tasks with no category', () => {
      const tasks = [task({ category: null }), task({ category: 'Kitchen' })]
      const result = computed.categories.call({ tasks })
      expect(result).toEqual(['Kitchen'])
    })
  })

  describe('sections', () => {
    it('produces 5 frequency sections', () => {
      const result = computed.sections.call({ filteredTasks: [] })
      expect(result).toHaveLength(5)
      expect(result.map(s => s.key)).toEqual([
        'daily-morning', 'daily-evening', 'weekly', 'monthly', 'quarterly',
      ])
    })

    it('places a daily-morning task in the correct section', () => {
      const tasks = [task({ id: 1, frequency: 'daily', time_of_day: 'morning' })]
      const result = computed.sections.call({ filteredTasks: tasks })
      expect(result.find(s => s.key === 'daily-morning').tasks[0].id).toBe(1)
      expect(result.find(s => s.key === 'daily-evening').tasks).toHaveLength(0)
    })
  })
})
