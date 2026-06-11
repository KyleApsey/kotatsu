function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default defineNuxtPlugin(async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const config = useRuntimeConfig()
  const vapidKey = config.public.vapidPublicKey
  if (!vapidKey) return

  // Don't re-prompt if already decided
  if (Notification.permission === 'denied') return

  try {
    const registration = await navigator.serviceWorker.ready

    // Reuse existing subscription if present
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }

    // Save to Supabase (upsert on endpoint so re-installs update gracefully)
    const supabase = useSupabaseClient()
    const { endpoint, keys } = subscription.toJSON()
    await supabase.from('push_subscriptions').upsert(
      { endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'endpoint' }
    )
  } catch (e) {
    // Push silently unavailable (e.g. iOS not added to home screen yet)
    console.debug('Push subscription skipped:', e.message)
  }
})
