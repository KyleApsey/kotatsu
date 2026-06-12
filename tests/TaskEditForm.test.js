import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskEditForm from '../app/components/TaskEditForm.vue'

const dailyTask = {
  id: 1,
  label: 'Wash dishes',
  frequency: 'daily',
  time_of_day: 'morning',
  day_of_week: null,
  category: 'Kitchen',
  group_name: 'Chores',
}

function mountForm(overrides = {}) {
  return mount(TaskEditForm, {
    props: {
      modelValue: true,
      task: null,
      defaultFrequency: 'daily',
      defaultTimeOfDay: 'morning',
      defaultDayOfWeek: null,
      existingCategories: [],
      existingGroupNames: [],
      onSave: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    },
    attachTo: document.body,
    global: {
      // Render <teleport> inline so .find() works within the wrapper
      stubs: { teleport: { template: '<div><slot /></div>' } },
    },
  })
}

describe('TaskEditForm', () => {
  describe('add mode', () => {
    it('renders "New task" title when no task prop', () => {
      const w = mountForm()
      expect(w.find('.sheet-title').text()).toBe('New task')
    })

    it('shows frequency select in add mode', () => {
      const w = mountForm()
      expect(w.find('select').exists()).toBe(true)
    })

    it('shows time_of_day field only for daily frequency', async () => {
      const w = mountForm()
      expect(w.text()).toContain('Time of day')

      await w.setData({ form: { ...w.vm.form, frequency: 'monthly' } })
      expect(w.text()).not.toContain('Time of day')
    })

    it('shows day_of_week field only for weekly frequency', async () => {
      const w = mountForm()
      expect(w.text()).not.toContain('Day')

      await w.setData({ form: { ...w.vm.form, frequency: 'weekly' } })
      expect(w.text()).toContain('Day')
    })
  })

  describe('edit mode', () => {
    it('renders "Edit task" title when task prop is provided', () => {
      const w = mountForm({ task: dailyTask })
      expect(w.find('.sheet-title').text()).toBe('Edit task')
    })

    it('pre-populates form fields from the task', () => {
      const w = mountForm({ task: dailyTask })
      expect(w.vm.form.label).toBe('Wash dishes')
      expect(w.vm.form.category).toBe('Kitchen')
      expect(w.vm.form.frequency).toBe('daily')
    })

    it('locks frequency and shows hint in edit mode', () => {
      const w = mountForm({ task: dailyTask })
      expect(w.find('.field-locked').exists()).toBe(true)
      expect(w.find('.field-locked-hint').exists()).toBe(true)
      // No frequency select — only time_of_day select remains (daily task)
      const selects = w.findAll('select')
      expect(selects.every(s => s.attributes('aria-label') !== 'frequency')).toBe(true)
      // The locked div shows the frequency text
      expect(w.find('.field-locked').text()).toContain('daily')
    })
  })

  describe('cancel', () => {
    it('emits update:modelValue=false on cancel', async () => {
      const w = mountForm()
      await w.find('.sheet-cancel').trigger('click')
      expect(w.emitted('update:modelValue')).toBeTruthy()
      expect(w.emitted('update:modelValue')[0][0]).toBe(false)
    })
  })

  describe('submit / error handling', () => {
    it('calls onSave prop with form data on submit', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const w = mountForm({ onSave })
      await w.setData({ form: { ...w.vm.form, label: 'Mop floor' } })
      await w.find('form').trigger('submit')
      await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ label: 'Mop floor' })))
    })

    it('closes form after successful save', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const w = mountForm({ onSave })
      await w.setData({ form: { ...w.vm.form, label: 'Mop floor' } })
      await w.find('form').trigger('submit')
      await vi.waitFor(() => {
        const emits = w.emitted('update:modelValue')
        return emits && emits.some(e => e[0] === false)
      })
    })

    it('shows error and stays open when onSave rejects', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Server error'))
      const w = mountForm({ task: dailyTask, onSave })
      await w.find('form').trigger('submit')
      await vi.waitFor(() => w.find('.sheet-error').exists())
      expect(w.find('.sheet-error').text()).toContain('Server error')
      // Form stays open — no close emit
      const closeEmits = w.emitted('update:modelValue') || []
      expect(closeEmits.filter(e => e[0] === false)).toHaveLength(0)
    })
  })
})
