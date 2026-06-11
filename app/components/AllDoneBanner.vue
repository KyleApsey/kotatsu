<template>
  <div class="all-done-banner">
    <p class="all-done-primary">All done for today.</p>
    <p v-if="partnerInitial" class="all-done-secondary">You and {{ partnerInitial }} finished everything.</p>
  </div>
</template>

<script>
export default {
  name: 'AllDoneBanner',

  props: {
    partnerInitial: { type: String, default: null },
  },
}
</script>

<style lang="scss" scoped>
.all-done-banner {
  margin: var(--space-xl) var(--space-lg);
  padding: var(--space-lg);
  background: var(--color-done-bg);
  border: 1.5px dashed var(--color-done-accent);
  border-radius: 8px;
  text-align: center;
  animation: fadein 200ms ease-out;
}

.all-done-primary {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-done-accent);
}

.all-done-secondary {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-done-accent);
  opacity: 0.8;
}

@keyframes fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
