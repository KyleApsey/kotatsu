import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    env: {
      NUXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NUXT_PUBLIC_SUPABASE_KEY: 'sb_publishable_test',
      NUXT_PUBLIC_HOUSEHOLD_TZ: 'America/Detroit',
      NUXT_PUBLIC_VAPID_PUBLIC_KEY: 'test_vapid_key',
    },
  },
})
