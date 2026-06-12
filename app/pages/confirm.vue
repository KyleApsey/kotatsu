<template>
  <div class="confirm-page">
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'ConfirmPage',

  data() {
    return {
      message: 'Signing you in…',
    }
  },

  async mounted() {
    const route = useRoute()
    const router = useRouter()
    const supabase = useSupabaseClient()

    const code = route.query.code
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(String(code))
      if (!error) {
        return router.push('/')
      }
      this.message = 'Sign-in failed. Please try again.'
    } else {
      return router.push('/login')
    }
  },
}
</script>

<style lang="scss" scoped>
.confirm-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  font-size: 15px;
  color: var(--color-text-tertiary);
}
</style>
