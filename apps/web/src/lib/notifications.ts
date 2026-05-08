/**
 * notifications.ts
 * OneSignal Web Push helpers.
 *
 * Requires VITE_ONESIGNAL_APP_ID in .env.local.
 * When the env var is absent (dev / CI) every call is a no-op so the rest of
 * the app keeps working without a OneSignal account.
 */
import OneSignal from 'react-onesignal'
import { supabase } from '@myexpert/shared'

let _initialized = false

/** Call once on app boot (before any auth). */
export async function initOneSignal(): Promise<void> {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined
  if (!appId || _initialized) return
  try {
    await OneSignal.init({
      appId,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      allowLocalhostAsSecureOrigin: true,
    })
    _initialized = true
  } catch (e) {
    console.warn('[OneSignal] init failed:', e)
  }
}

/**
 * Link the browser subscription to the signed-in user's Supabase UUID so we
 * can target them by external_id from the server.
 * Call this right after the user authenticates.
 */
export async function subscribeUser(userId: string): Promise<void> {
  if (!_initialized) return
  try {
    await OneSignal.login(userId)
    await OneSignal.Notifications.requestPermission()
  } catch (e) {
    console.warn('[OneSignal] subscribe failed:', e)
  }
}

/** Unlink the subscription on sign-out. */
export async function unsubscribeUser(): Promise<void> {
  if (!_initialized) return
  try {
    await OneSignal.logout()
  } catch (e) {
    console.warn('[OneSignal] logout failed:', e)
  }
}

/**
 * Fire-and-forget: ask the `send-push` edge function to push a notification
 * to another user.  Errors are swallowed — push is always best-effort.
 */
export async function sendPush(
  toUserId: string,
  title:    string,
  message:  string,
  url?:     string,
): Promise<void> {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined
  if (!appId) return   // OneSignal not configured
  try {
    await supabase.functions.invoke('send-push', {
      body: { to_user_id: toUserId, title, message, url },
    })
  } catch (e) {
    console.warn('[OneSignal] sendPush failed:', e)
  }
}
