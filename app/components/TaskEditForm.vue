<template>
  <teleport to="body">
    <transition name="bottom-sheet">
      <div v-if="modelValue" class="sheet-backdrop" @click.self="cancel">
        <div class="sheet" role="dialog" aria-modal="true">
          <div class="sheet-handle" />

          <div class="sheet-header">
            <h2 class="sheet-title">{{ isEditing ? 'Edit task' : 'New task' }}</h2>
            <button class="sheet-cancel" @click="cancel">Cancel</button>
          </div>

          <form class="sheet-form" @submit.prevent="submit">
            <!-- Label -->
            <div class="field">
              <label class="field-label">Task</label>
              <input
                ref="labelInput"
                v-model="form.label"
                type="text"
                class="field-input"
                placeholder="e.g. Make bed"
                maxlength="256"
                required
              />
            </div>

            <!-- Frequency (read-only on edit) -->
            <div class="field">
              <label class="field-label">Frequency</label>
              <select v-if="!isEditing" v-model="form.frequency" class="field-input">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              <div v-else class="field-locked">
                {{ form.frequency }}
                <span class="field-locked-hint">To change, archive and create a new task</span>
              </div>
            </div>

            <!-- Time of day (daily only) -->
            <div v-if="form.frequency === 'daily'" class="field">
              <label class="field-label">Time of day</label>
              <select v-model="form.time_of_day" class="field-input">
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <!-- Day of week (weekly only) -->
            <div v-if="form.frequency === 'weekly'" class="field">
              <label class="field-label">Day</label>
              <select v-model="form.day_of_week" class="field-input">
                <option :value="1">Monday</option>
                <option :value="2">Tuesday</option>
                <option :value="3">Wednesday</option>
                <option :value="4">Thursday</option>
                <option :value="5">Friday</option>
                <option :value="6">Saturday</option>
                <option :value="7">Sunday</option>
              </select>
            </div>

            <!-- Category -->
            <div class="field">
              <label class="field-label">Category</label>
              <input
                v-model="form.category"
                type="text"
                class="field-input"
                placeholder="e.g. Cleaning"
                list="category-options"
              />
              <datalist id="category-options">
                <option v-for="c in existingCategories" :key="c" :value="c" />
              </datalist>
            </div>

            <!-- Group name -->
            <div class="field">
              <label class="field-label">Group</label>
              <input
                v-model="form.group_name"
                type="text"
                class="field-input"
                placeholder="e.g. Kitchen"
                list="group-options"
              />
              <datalist id="group-options">
                <option v-for="g in existingGroupNames" :key="g" :value="g" />
              </datalist>
            </div>

            <p v-if="error" class="sheet-error">{{ error }}</p>

            <button
              type="submit"
              class="sheet-submit"
              :disabled="saving || !form.label.trim()"
            >
              {{ saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add task' }}
            </button>
          </form>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: 'TaskEditForm',

  props: {
    modelValue: { type: Boolean, required: true },
    task: { type: Object, default: null }, // null = new task
    defaultFrequency: { type: String, default: 'daily' },
    defaultTimeOfDay: { type: String, default: 'morning' },
    defaultDayOfWeek: { type: Number, default: null },
    existingCategories: { type: Array, default: () => [] },
    existingGroupNames: { type: Array, default: () => [] },
    onSave: { type: Function, required: true },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      form: this.task ? this.formFromTask(this.task) : this.blankForm(),
      saving: false,
      error: null,
    }
  },

  computed: {
    isEditing() { return !!this.task },
  },

  watch: {
    modelValue(open) {
      if (open) {
        this.error = null
        this.saving = false
        this.form = this.task ? this.formFromTask(this.task) : this.blankForm()
        this.$nextTick(() => this.$refs.labelInput?.focus())
      }
    },
  },

  methods: {
    blankForm() {
      return {
        label: '',
        frequency: this.defaultFrequency,
        time_of_day: this.defaultTimeOfDay || 'morning',
        day_of_week: this.defaultDayOfWeek || 1,
        category: '',
        group_name: '',
      }
    },

    formFromTask(task) {
      return {
        label: task.label,
        frequency: task.frequency,
        time_of_day: task.time_of_day || 'morning',
        day_of_week: task.day_of_week || 1,
        category: task.category || '',
        group_name: task.group_name || '',
      }
    },

    cancel() {
      this.$emit('update:modelValue', false)
    },

    async submit() {
      this.saving = true
      this.error = null
      try {
        await this.onSave({ ...this.form, id: this.task?.id })
        this.$emit('update:modelValue', false)
      } catch (e) {
        this.error = e.message || 'Could not save — tap to retry.'
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: var(--color-surface);
  border-radius: 16px 16px 0 0;
  padding: 0 0 env(safe-area-inset-bottom);
  max-height: 90dvh;
  overflow-y: auto;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--color-checkbox-border);
  border-radius: 2px;
  margin: 12px auto 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.sheet-cancel {
  font-size: 14px;
  color: var(--color-text-secondary);
  padding: 4px 0;
}

.sheet-form {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.field-input {
  padding: 11px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 15px;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  appearance: none;
  -webkit-appearance: none;

  &:focus {
    border-color: var(--color-checked);
  }
}

.field-locked {
  padding: 11px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 15px;
  color: var(--color-text-secondary);
  background: var(--color-surface-alt);
  text-transform: capitalize;
}

.field-locked-hint {
  display: block;
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

.sheet-error {
  font-size: 13px;
  color: #C0392B;
}

.sheet-submit {
  padding: 13px;
  background: var(--color-checked);
  color: var(--color-surface);
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  margin-top: var(--space-sm);

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
}

// Bottom sheet animation
.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  .sheet { transform: translateY(100%); }
  opacity: 0;
}
.bottom-sheet-enter-active {
  transition: opacity 200ms ease-out;
  .sheet { transition: transform 200ms ease-out; }
}
.bottom-sheet-leave-active {
  transition: opacity 150ms ease-in;
  .sheet { transition: transform 150ms ease-in; }
}
</style>
