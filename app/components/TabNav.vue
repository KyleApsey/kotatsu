<template>
  <nav class="tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab"
      :class="{ 'tab--active': modelValue === tab.key }"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script>
export default {
  name: 'TabNav',

  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      tabs: [
        { key: 'daily', label: 'Today' },
        { key: 'weekly', label: 'This Week' },
        { key: 'monthly', label: 'Monthly' },
        { key: 'quarterly', label: 'Quarterly' },
      ],
    }
  },
}
</script>

<style lang="scss" scoped>
.tab-nav {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab {
  flex-shrink: 0;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  transition: none;
  white-space: nowrap;

  &--active {
    color: var(--color-text-primary);
    border-bottom-color: var(--color-checked);
  }
}
</style>
