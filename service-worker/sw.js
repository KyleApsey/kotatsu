import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Serve the app shell for all navigation requests
registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: 'navigations' }),
    { denylist: [/^\/api\//] }
  )
)

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kotatsu', {
      body: data.body || 'You have tasks waiting.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/' },
    })
  )
})

// Open the app when a notification is tapped
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find(c => c.url.startsWith(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow('/')
    })
  )
})
