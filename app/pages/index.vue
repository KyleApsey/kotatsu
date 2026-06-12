<template>
  <div class="app-shell">
    <!-- Header -->
    <header class="app-header">
      <div class="header-top">
        <div>
          <h1 class="app-title">Kotatsu</h1>
          <p class="app-date">{{ dateLabel }}</p>
        </div>
        <div class="header-right">
          <span v-if="!allDone" class="header-count">{{ totalRemaining }} left</span>
          <NuxtLink to="/manage" class="gear-btn" aria-label="Manage tasks">⚙</NuxtLink>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPct + '%' }" />
      </div>
    </header>

    <!-- Tab nav -->
    <TabNav v-model="activeTab" />

    <!-- Content -->
    <main class="app-content">
      <div v-if="loading" class="loading-state">
        <div v-for="n in 3" :key="n" class="skeleton-group">
          <div class="skeleton-header" />
          <div v-for="m in 4" :key="m" class="skeleton-row" />
        </div>
      </div>

      <template v-else>
        <AllDoneBanner v-if="allDone" />

        <template v-if="activeTab === 'daily'">
          <template v-if="morningGroups.length">
            <div class="time-section-label">Morning</div>
            <TaskGroup
              v-for="group in morningGroups"
              :key="'morning-' + group.name"
              :name="group.name"
              :tasks="group.tasks"
              :completions="completions"
              :period-key="morningKey"
              :current-user="currentUser"
              :streak="streak"
              @check="checkTask($event, morningKey)"
              @uncheck="uncheckTask($event, morningKey)"
            />
          </template>
          <template v-if="eveningGroups.length">
            <div class="time-section-label">Evening</div>
            <TaskGroup
              v-for="group in eveningGroups"
              :key="'evening-' + group.name"
              :name="group.name"
              :tasks="group.tasks"
              :completions="completions"
              :period-key="eveningKey"
              :current-user="currentUser"
              :streak="streak"
              @check="checkTask($event, eveningKey)"
              @uncheck="uncheckTask($event, eveningKey)"
            />
          </template>
        </template>

        <template v-else>
          <TaskGroup
            v-for="group in activeGroups"
            :key="group.name"
            :name="group.name"
            :tasks="group.tasks"
            :completions="completions"
            :period-key="activePeriodKey"
            :current-user="currentUser"
            @check="checkTask($event, activePeriodKey)"
            @uncheck="uncheckTask($event, activePeriodKey)"
          />
        </template>
      </template>
    </main>
  </div>
</template>

<script>
export default {
  name: 'HomePage',

  setup() {
    const { tasks, completions, loading, cleanup } = useTasks()
    const streak = useStreak(tasks, completions)
    return { tasks, completions, loading, cleanup, streak }
  },

  data() {
    return {
      activeTab: 'daily',
      now: new Date(),
    }
  },

  computed: {
    currentUser() {
      return useSupabaseUser().value
    },

    grouped() {
      return groupTasksByFrequency(this.tasks)
    },

    morningKey() {
      return usePeriodKey({ frequency: 'daily', time_of_day: 'morning' }, this.now)
    },

    eveningKey() {
      return usePeriodKey({ frequency: 'daily', time_of_day: 'evening' }, this.now)
    },

    activePeriodKey() {
      if (this.activeTab === 'daily') return this.morningKey
      return usePeriodKey({ frequency: this.activeTab }, this.now)
    },

    morningGroups() { return this.grouped.daily.morning },
    eveningGroups() { return this.grouped.daily.evening },
    activeGroups() { return this.grouped[this.activeTab] || [] },

    allTasksForTab() {
      if (this.activeTab === 'daily') {
        return [
          ...this.morningGroups.flatMap(g => g.tasks),
          ...this.eveningGroups.flatMap(g => g.tasks),
        ]
      }
      return this.activeGroups.flatMap(g => g.tasks)
    },

    totalRemaining() {
      if (this.activeTab === 'daily') {
        const morningDone = this.morningGroups.flatMap(g => g.tasks).filter(t =>
          this.completions.some(c => c.task_id === t.id && c.period_key === this.morningKey)
        ).length
        const eveningDone = this.eveningGroups.flatMap(g => g.tasks).filter(t =>
          this.completions.some(c => c.task_id === t.id && c.period_key === this.eveningKey)
        ).length
        const total = this.morningGroups.flatMap(g => g.tasks).length + this.eveningGroups.flatMap(g => g.tasks).length
        return total - morningDone - eveningDone
      }
      return this.allTasksForTab.filter(t =>
        !this.completions.some(c => c.task_id === t.id && c.period_key === this.activePeriodKey)
      ).length
    },

    allDone() {
      return !this.loading && this.allTasksForTab.length > 0 && this.totalRemaining === 0
    },

    progressPct() {
      const total = this.allTasksForTab.length
      if (!total) return 0
      return Math.round(((total - this.totalRemaining) / total) * 100)
    },

    dateLabel() {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      }).format(this.now)
    },
  },

  beforeUnmount() {
    this.cleanup()
  },

  methods: {
    async checkTask(task, periodKey) {
      const supabase = useSupabaseClient()
      const user = useSupabaseUser().value
      await supabase.from('completions').upsert({
        task_id: task.id,
        period_key: periodKey,
        completed_by: user?.email || 'unknown',
        completed_at: new Date().toISOString(),
      }, { onConflict: 'task_id,period_key', ignoreDuplicates: true })
    },

    async uncheckTask(task, periodKey) {
      const supabase = useSupabaseClient()
      await supabase
        .from('completions')
        .delete()
        .eq('task_id', task.id)
        .eq('period_key', periodKey)
    },
  },
}
</script>

<style lang="scss" scoped>
.app-shell {
  min-height: 100dvh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-lg) var(--space-lg) 0;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: var(--space-md);
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.app-date {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-top: 4px;
}

.header-count {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.gear-btn {
  font-size: 20px;
  color: var(--color-text-tertiary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar {
  height: 4px;
  background: var(--color-progress-track);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-checked);
  border-radius: 2px;
}

.app-content {
  flex: 1;
  padding-bottom: var(--space-xl);
}

.time-section-label {
  padding: var(--space-lg) var(--space-md) var(--space-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading-state {
  padding-top: var(--space-lg);
}

.skeleton-header {
  height: 36px;
  background: var(--color-border-light);
  margin-bottom: 1px;
}

.skeleton-row {
  height: 46px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
}

.skeleton-group {
  margin-top: var(--space-lg);

  &:first-child {
    margin-top: 0;
  }
}
</style>
