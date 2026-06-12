import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTaskAdmin } from '../app/composables/useTaskAdmin.js'

// Fluent chain mock that is also awaitable (mirrors Supabase PostgREST builder)
function mockChain(result = { error: null, data: null, count: 0 }) {
  const chain = {
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    in: vi.fn(() => chain),
    then: (resolve) => Promise.resolve(result).then(resolve),
  }
  return chain
}

let mockSupabase
let admin

beforeEach(() => {
  const chain = mockChain()
  mockSupabase = {
    rpc: vi.fn().mockResolvedValue({ data: 42, error: null }),
    from: vi.fn(() => chain),
    _chain: chain,
  }
  admin = createTaskAdmin(mockSupabase)
})

describe('createTaskAdmin', () => {
  describe('addTask', () => {
    it('calls add_task_with_sort_order RPC with correct params', async () => {
      await admin.addTask({
        label: 'Wash dishes',
        frequency: 'daily',
        time_of_day: 'morning',
        day_of_week: null,
        category: 'Kitchen',
        group_name: 'Chores',
      })
      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_task_with_sort_order', {
        p_label: 'Wash dishes',
        p_frequency: 'daily',
        p_time_of_day: 'morning',
        p_day_of_week: null,
        p_category: 'Kitchen',
        p_group_name: 'Chores',
      })
    })

    it('trims whitespace from label and category', async () => {
      await admin.addTask({
        label: '  Wash dishes  ',
        frequency: 'daily',
        time_of_day: null,
        day_of_week: null,
        category: '  Cleaning  ',
        group_name: '  General  ',
      })
      const call = mockSupabase.rpc.mock.calls[0][1]
      expect(call.p_label).toBe('Wash dishes')
      expect(call.p_category).toBe('Cleaning')
      expect(call.p_group_name).toBe('General')
    })

    it('throws when RPC returns error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } })
      await expect(
        admin.addTask({ label: 'X', frequency: 'daily', time_of_day: 'morning', day_of_week: null, category: 'C', group_name: 'G' })
      ).rejects.toMatchObject({ message: 'DB error' })
    })
  })

  describe('archiveTask', () => {
    it('updates archived_at on the tasks table', async () => {
      const chain = mockChain()
      mockSupabase.from.mockReturnValue(chain)

      await admin.archiveTask(7)

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ archived_at: expect.any(String) }))
      expect(chain.eq).toHaveBeenCalledWith('id', 7)
    })
  })

  describe('renameCategory', () => {
    it('throws when count is 0 (optimistic lock failure)', async () => {
      const chain = mockChain({ error: null, count: 0 })
      mockSupabase.from.mockReturnValue(chain)

      await expect(admin.renameCategory('Kitchen', 'Cooking', 1))
        .rejects.toThrow('Category was already renamed')
    })

    it('does not throw when count > 0', async () => {
      const chain = mockChain({ error: null, count: 3 })
      mockSupabase.from.mockReturnValue(chain)

      await expect(admin.renameCategory('Kitchen', 'Cooking', 1)).resolves.toBeUndefined()
    })
  })
})
