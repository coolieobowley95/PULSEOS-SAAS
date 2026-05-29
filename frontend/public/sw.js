// frontend/public/sw.js
// Service worker — handles incoming push events and displays notifications.
// Must be in /public so it's served from the root of the domain.

self.addEventListener('push', event => {
  if (!event.data) return

  const data = event.data.json()
  

  event.waitUntil(
    self.registration.showNotification(data.title || 'PulseOS', {
      body:    data.body  || '',
      icon:    data.icon  || '/favicon.svg',
      badge:   '/favicon.svg',
      vibrate: [100, 50, 100],
      data:    { url: data.url || '/' },
    })
  )
})

// Click on notification → open/focus the app
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(event.notification.data?.url || '/')
    })
  )
})