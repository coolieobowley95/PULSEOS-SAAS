// frontend/src/services/push.js
// Handles browser push notification subscription.
// Called once after user grants permission — sends subscription to backend.

import api from './api'

// Convert base64 VAPID public key to Uint8Array (required by browser API)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

// ─── Request permission + subscribe ──────────────────────────────────────────
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser')
    return false
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  try {
    const registration = await navigator.serviceWorker.ready
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    // Send subscription to backend for storage
    await api.post('/push/subscribe', subscription.toJSON())
    return true
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}

// ─── Unsubscribe ──────────────────────────────────────────────────────────────
export async function unsubscribeFromPush() {
  try {
    const registration   = await navigator.serviceWorker.ready
    const subscription   = await registration.pushManager.getSubscription()
    if (subscription) {
      await api.delete('/push/unsubscribe', { data: { endpoint: subscription.endpoint } })
      await subscription.unsubscribe()
    }
    return true
  } catch (err) {
    console.error('Unsubscribe failed:', err)
    return false
  }
}

// ─── Check current permission state ──────────────────────────────────────────
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'granted' | 'denied' | 'default'
}