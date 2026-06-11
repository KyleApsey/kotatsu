<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="app-name">Kotatsu</h1>
      <p class="tagline">Household tasks, together</p>

      <form v-if="!sent" @submit.prevent="sendMagicLink">
        <input
          v-model="email"
          type="email"
          placeholder="Email address"
          required
          autocomplete="email"
          :disabled="loading"
        />
        <button type="submit" :disabled="loading || !email">
          {{ loading ? 'Sending…' : 'Send magic link' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <div v-else class="sent">
        <p>Check your email for a login link.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',

  data() {
    return {
      email: '',
      loading: false,
      sent: false,
      error: null,
    }
  },

  methods: {
    async sendMagicLink() {
      this.loading = true
      this.error = null
      const supabase = useSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: this.email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      })
      if (error) {
        this.error = error.message
      } else {
        this.sent = true
      }
      this.loading = false
    },
  },
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F7F6F1;
  padding: 24px;
}

.login-card {
  background: #FDFCF9;
  border-radius: 16px;
  padding: 40px 32px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.app-name {
  font-size: 28px;
  font-weight: 700;
  color: #2C2C2C;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.tagline {
  font-size: 14px;
  color: #999;
  margin: 0 0 32px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input[type="email"] {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #E8E6E0;
  border-radius: 10px;
  font-size: 16px;
  color: #2C2C2C;
  background: #F7F6F1;
  outline: none;
  box-sizing: border-box;
  transition: border-color 150ms;

  &:focus {
    border-color: #5A7A5A;
  }

  &::placeholder {
    color: #BBB;
  }

  &:disabled {
    opacity: 0.5;
  }
}

button[type="submit"] {
  padding: 13px 16px;
  background: #5A7A5A;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
}

.sent p {
  font-size: 15px;
  color: #5A7A5A;
  font-weight: 500;
}

.error {
  font-size: 13px;
  color: #C0392B;
  margin: 0;
}
</style>
