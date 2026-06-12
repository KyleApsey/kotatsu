<template>
  <div class="manage-shell">
    <header class="manage-header">
      <button class="back-btn" @click="$router.back()">← Manage tasks</button>
    </header>

    <div v-if="loading" class="manage-loading">Loading…</div>

    <template v-else>
      <!-- Category filter chips (2-step rename: tap to filter, tap pencil to rename) -->
      <div v-if="categories.length > 1" class="category-chips">
        <button
          class="chip"
          :class="{ 'chip--active': !activeCategory }"
          @click="activeCategory = null; renamingCategory = null"
        >All</button>

        <div v-for="cat in categories" :key="cat" class="chip-wrap">
          <!-- Rename mode: inline input -->
          <template v-if="renamingCategory === cat">
            <input
              ref="renameInput"
              v-model="renameCategoryName"
              class="chip-rename-input"
              @keyup.enter="commitRename"
              @keyup.escape="renamingCategory = null"
            />
            <button class="chip-rename-save" @click="commitRename">✓</button>
            <button class="chip-rename-cancel" @click="renamingCategory = null">✕</button>
          </template>

          <!-- Normal/active mode -->
          <template v-else>
            <button
              class="chip"
              :class="{ 'chip--active': activeCategory === cat }"
              @click="activeCategory = cat"
            >{{ cat }}</button>
            <button
              v-if="activeCategory === cat"
              class="chip-edit-btn"
              aria-label="Rename category"
              @click.stop="startRename(cat)"
            >✎</button>
          </template>
        </div>
      </div>

      <!-- Task groups by frequency -->
      <div v-for="section in sections" :key="section.key" class="manage-section">
        <div class="manage-section-header">
          <span class="manage-section-title">{{ section.label }}</span>
          <span class="manage-section-count">{{ section.tasks.length }} tasks</span>
        </div>

        <!-- Archive confirmation strip -->
        <template v-for="task in section.tasks" :key="task.id">
          <div
            class="manage-row"
            :class="{ 'manage-row--dragging': draggedTask?.id === task.id }"
            :data-task-id="task.id"
            :data-section-key="section.key"
            @touchstart.passive="onTouchStart($event, task, section.key)"
            @touchmove="onTouchMove($event)"
            @touchend.passive="onTouchEnd($event)"
          >
            <span class="drag-handle">⋮⋮</span>
            <span class="manage-row-label">{{ task.label }}</span>
            <button class="edit-btn" @click="openEdit(task)">✎</button>
            <button class="archive-btn" @click="confirmArchive(task)">✕</button>
          </div>

          <div v-if="archiveTarget?.id === task.id" class="archive-confirm">
            <span class="archive-confirm-label">"{{ task.label }}"</span>
            <div class="archive-confirm-actions">
              <button class="archive-keep" @click="archiveTarget = null">Keep</button>
              <button class="archive-do" @click="doArchive(task)">Archive</button>
            </div>
          </div>
        </template>

        <!-- Add task row -->
        <button class="add-row" @click="openAdd(section)">+ Add task</button>
      </div>
    </template>

    <TaskEditForm
      v-model="formOpen"
      :task="editingTask"
      :default-frequency="formDefaultFrequency"
      :default-time-of-day="formDefaultTimeOfDay"
      :default-day-of-week="formDefaultDayOfWeek"
      :existing-categories="existingCategories"
      :existing-group-names="existingGroupNames"
      :on-save="onFormSaved"
    />
  </div>
</template>

<script>
const FREQUENCY_SECTIONS = [
  { key: 'daily-morning', label: 'Daily Morning', frequency: 'daily', time_of_day: 'morning' },
  { key: 'daily-evening', label: 'Daily Evening', frequency: 'daily', time_of_day: 'evening' },
  { key: 'weekly',        label: 'Weekly',        frequency: 'weekly' },
  { key: 'monthly',       label: 'Monthly',       frequency: 'monthly' },
  { key: 'quarterly',     label: 'Quarterly',     frequency: 'quarterly' },
]

export default {
  name: 'ManagePage',

  setup() {
    const { tasks, loading, cleanup } = useTasks()
    const { addTask, updateTask, archiveTask, updateSortOrder, renameCategory } = useTaskAdmin()
    return { tasks, loading, cleanup, addTask, updateTask, archiveTask, updateSortOrder, renameCategory }
  },

  data() {
    return {
      activeCategory: null,
      archiveTarget: null,
      renamingCategory: null,
      renameCategoryName: '',
      formOpen: false,
      editingTask: null,
      formDefaultFrequency: 'daily',
      formDefaultTimeOfDay: 'morning',
      formDefaultDayOfWeek: null,
      draggedTask: null,
      draggedSection: null,
    }
  },

  computed: {
    filteredTasks() {
      if (!this.activeCategory) return this.tasks
      return this.tasks.filter(t => t.category === this.activeCategory)
    },

    categories() {
      return [...new Set(this.tasks.map(t => t.category).filter(Boolean))].sort()
    },

    existingCategories() {
      return [...new Set(this.tasks.map(t => t.category).filter(Boolean))]
    },

    existingGroupNames() {
      return [...new Set(this.tasks.map(t => t.group_name).filter(Boolean))]
    },

    sections() {
      return FREQUENCY_SECTIONS.map(s => ({
        ...s,
        tasks: this.filteredTasks.filter(t => {
          if (t.frequency !== s.frequency) return false
          if (s.time_of_day) return t.time_of_day === s.time_of_day
          return true
        }),
      }))
    },
  },

  beforeUnmount() {
    this.cleanup()
  },

  methods: {
    startRename(cat) {
      this.renamingCategory = cat
      this.renameCategoryName = cat
      this.$nextTick(() => {
        const input = this.$refs.renameInput
        const el = Array.isArray(input) ? input[0] : input
        el?.focus()
        el?.select()
      })
    },

    async commitRename() {
      const oldName = this.renamingCategory
      const newName = this.renameCategoryName.trim()
      if (!newName || newName === oldName) { this.renamingCategory = null; return }

      const categoryVersion = this.tasks.find(t => t.category === oldName)?.category_version ?? 0
      try {
        await this.renameCategory(oldName, newName, categoryVersion)
        if (this.activeCategory === oldName) this.activeCategory = newName
        this.renamingCategory = null
      } catch (e) {
        this.renamingCategory = null
        alert(e.message || 'Rename failed — refresh and try again.')
      }
    },

    openEdit(task) {
      this.editingTask = task
      this.formOpen = true
    },

    openAdd(section) {
      this.editingTask = null
      this.formDefaultFrequency = section.frequency
      this.formDefaultTimeOfDay = section.time_of_day || 'morning'
      this.formDefaultDayOfWeek = null
      this.formOpen = true
    },

    confirmArchive(task) {
      this.archiveTarget = this.archiveTarget?.id === task.id ? null : task
    },

    async doArchive(task) {
      this.archiveTarget = null
      await this.archiveTask(task.id)
    },

    async onFormSaved(fields) {
      if (fields.id) {
        await this.updateTask(fields.id, fields)
      } else {
        await this.addTask(fields)
      }
    },

    // Touch-based drag-to-reorder (works on iOS Safari; within section only)
    onTouchStart(event, task, sectionKey) {
      this.draggedTask = task
      this.draggedSection = sectionKey
    },

    onTouchMove(event) {
      if (!this.draggedTask) return
      event.preventDefault() // prevent page scroll while dragging
    },

    async onTouchEnd(event) {
      if (!this.draggedTask) return

      const touch = event.changedTouches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const row = el?.closest('[data-task-id]')

      if (row) {
        const overTaskId = parseInt(row.dataset.taskId)
        const sectionKey = row.dataset.sectionKey

        if (sectionKey === this.draggedSection && overTaskId !== this.draggedTask.id) {
          const section = this.sections.find(s => s.key === sectionKey)
          if (section) {
            const tasks = [...section.tasks]
            const fromIdx = tasks.findIndex(t => t.id === this.draggedTask.id)
            const toIdx = tasks.findIndex(t => t.id === overTaskId)

            if (fromIdx !== -1 && toIdx !== -1) {
              tasks.splice(fromIdx, 1)
              tasks.splice(toIdx, 0, this.draggedTask)
              await Promise.all(tasks.map((t, i) => this.updateSortOrder(t.id, i + 1)))
            }
          }
        }
      }

      this.draggedTask = null
      this.draggedSection = null
    },
  },
}
</script>

<style lang="scss" scoped>
.manage-shell {
  min-height: 100dvh;
  background: var(--color-bg);
  padding-bottom: 40px;
}

.manage-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-lg);
}

.back-btn {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.manage-loading {
  padding: var(--space-xl);
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.category-chips {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.chip-wrap {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
}

.chip-edit-btn {
  font-size: 14px;
  color: var(--color-text-tertiary);
  padding: 2px 4px;
}

.chip-rename-input {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-checked);
  background: var(--color-surface);
  outline: none;
  min-width: 80px;
}

.chip-rename-save {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-checked);
  padding: 4px 6px;
}

.chip-rename-cancel {
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding: 4px 6px;
}

.chip {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);

  &--active {
    color: var(--color-text-primary);
    border-color: var(--color-checked);
    background: var(--color-surface);
  }
}

.manage-section {
  margin-top: var(--space-lg);
}

.manage-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface-alt);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.manage-section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-secondary);
}

.manage-section-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.manage-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: 46px;
  padding: 0 var(--space-md);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  cursor: grab;
  touch-action: none; // let JS handle touch events for drag

  &:active { cursor: grabbing; }

  &--dragging { opacity: 0.5; }
}

.drag-handle {
  font-size: 14px;
  color: var(--color-checkbox-border);
  width: 28px;
  flex-shrink: 0;
  letter-spacing: -2px;
}

.manage-row-label {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-primary);
}

.edit-btn {
  font-size: 16px;
  color: var(--color-text-secondary);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.archive-btn {
  font-size: 14px;
  color: var(--color-text-tertiary);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.archive-confirm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface-alt);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border-light);
}

.archive-confirm-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  flex: 1;
}

.archive-confirm-actions {
  display: flex;
  gap: var(--space-sm);
}

.archive-keep {
  font-size: 14px;
  color: var(--color-text-tertiary);
  padding: 6px 8px;
}

.archive-do {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-surface);
  background: var(--color-checked);
  border-radius: 4px;
  padding: 6px 12px;
}

.add-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 46px;
  padding: 0 var(--space-md);
  font-size: 14px;
  color: var(--color-text-tertiary);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  text-align: left;
}
</style>
