<template>
  <li
    class="task-row"
    :class="{ 'task-row--checked': isChecked, 'task-row--tapped': tapped }"
    @click="toggle"
    @touchstart.passive="tapped = true"
    @touchend.passive="tapped = false"
    @touchcancel.passive="tapped = false"
  >
    <span class="checkbox" :class="{ 'checkbox--checked': isChecked }" aria-hidden="true">
      <span v-if="isChecked" class="checkmark" />
    </span>
    <span class="task-content">
      <span class="task-label">{{ task.label }}</span>
      <span v-if="showLastDone" class="last-done">{{ lastDoneLabel }}</span>
    </span>
    <span v-if="isChecked && checkedBy" class="initials">{{ initials(checkedBy) }}</span>
  </li>
</template>

<script>
export default {
  name: 'TaskRow',

  props: {
    task: { type: Object, required: true },
    completions: { type: Array, required: true },
    periodKey: { type: String, required: true },
    currentUser: { type: Object, default: null },
  },

  emits: ['check', 'uncheck'],

  data() {
    return {
      tapped: false,
      optimistic: null, // true = optimistically checked, false = optimistically unchecked, null = use server state
    }
  },

  computed: {
    completion() {
      return this.completions.find(
        c => c.task_id === this.task.id && c.period_key === this.periodKey
      ) || null
    },

    isChecked() {
      if (this.optimistic !== null) return this.optimistic
      return !!this.completion
    },

    checkedBy() {
      return this.completion?.completed_by || null
    },

    showLastDone() {
      return this.task.frequency === 'monthly' || this.task.frequency === 'quarterly'
    },

    lastCompletion() {
      return this.completions
        .filter(c => c.task_id === this.task.id)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0] || null
    },

    lastDoneLabel() {
      if (!this.lastCompletion) return 'Never done'
      const date = new Date(this.lastCompletion.completed_at)
      const now = new Date()
      const days = Math.floor((now - date) / 86400000)
      if (days === 0) return 'Last done: today'
      if (days === 1) return 'Last done: yesterday'
      if (days < 14) return `Last done: ${days} days ago`
      if (days < 60) return `Last done: ${Math.floor(days / 7)} weeks ago`
      return `Last done: ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    },
  },

  watch: {
    completion() {
      // Server state arrived — clear optimistic override
      this.optimistic = null
    },
  },

  methods: {
    async toggle() {
      const willCheck = !this.isChecked
      this.optimistic = willCheck

      if (willCheck) {
        this.$emit('check', this.task)
      } else {
        this.$emit('uncheck', this.task)
      }
    },

    initials(email) {
      return email ? email[0].toUpperCase() : '?'
    },
  },
}
</script>

<style lang="scss" scoped>
.task-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: 46px;
  padding: var(--space-md);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;

  &:last-child {
    border-bottom: none;
  }

  &--tapped {
    background: var(--color-tap);
  }
}

.checkbox {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-checkbox-border);
  border-radius: 4px;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;

  &--checked {
    background: var(--color-checked);
    border-color: var(--color-checked);
  }
}

.checkmark {
  display: block;
  width: 6px;
  height: 11px;
  border-right: 2px solid var(--color-surface);
  border-bottom: 2px solid var(--color-surface);
  transform: rotate(45deg) translate(-1px, -1px);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-label {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--color-text-primary);

  .task-row--checked & {
    text-decoration: line-through;
    color: var(--color-text-done);
  }
}

.last-done {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary);
}

.initials {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}
</style>
