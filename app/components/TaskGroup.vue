<template>
  <div class="task-group">
    <div class="group-header">
      <span class="group-name">{{ name }}</span>
      <div class="group-right">
        <span class="group-fraction" :class="{ 'group-fraction--done': remaining === 0 }">
          {{ remaining === 0 ? 'done' : `${remaining} left` }}
        </span>
        <span v-if="streak > 0" class="group-streak">🔥 {{ streak }}</span>
      </div>
    </div>
    <ul class="task-list">
      <TaskRow
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :completions="completions"
        :period-key="periodKey"
        :current-user="currentUser"
        @check="$emit('check', $event)"
        @uncheck="$emit('uncheck', $event)"
      />
    </ul>
  </div>
</template>

<script>
export default {
  name: 'TaskGroup',

  props: {
    name: { type: String, required: true },
    tasks: { type: Array, required: true },
    completions: { type: Array, required: true },
    periodKey: { type: String, required: true },
    currentUser: { type: Object, default: null },
    streak: { type: Number, default: 0 },
  },

  emits: ['check', 'uncheck'],

  computed: {
    remaining() {
      return this.tasks.filter(task =>
        !this.completions.some(c => c.task_id === task.id && c.period_key === this.periodKey)
      ).length
    },
  },
}
</script>

<style lang="scss" scoped>
.task-group {
  margin-top: var(--space-lg);

  &:first-child {
    margin-top: 0;
  }
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface-alt);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.group-name {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.group-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.group-fraction {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);

  &--done {
    color: var(--color-done-accent);
  }
}

.group-streak {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.task-list {
  background: var(--color-surface);
}
</style>
