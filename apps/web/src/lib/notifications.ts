/**
 * notifications.ts
 * Unified notification helpers — OneSignal web push + Termii SMS.
 *
 * Both channels are fire-and-forget. Either can be absent without breaking
 * anything (push requires VITE_ONESIGNAL_APP_ID; SMS always attempts if the
 * send-sms edge function is deployed).
 */
import OneSignal from 'react-onesignal'
import { supabase } from '@myexpert/shared'

// ── OneSignal ─────────────────────────────────────────────────────────────────

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
 * Link browser subscription to the signed-in user's Supabase UUID.
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

/** Unlink subscription on sign-out. */
export async function unsubscribeUser(): Promise<void> {
  if (!_initialized) return
  try {
    await OneSignal.logout()
  } catch (e) {
    console.warn('[OneSignal] logout failed:', e)
  }
}

/** Fire-and-forget web push via `send-push` edge function. */
export async function sendPush(
  toUserId: string,
  title:    string,
  message:  string,
  url?:     string,
): Promise<void> {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined
  if (!appId) return
  try {
    await supabase.functions.invoke('send-push', {
      body: { to_user_id: toUserId, title, message, url },
    })
  } catch (e) {
    console.warn('[OneSignal] sendPush failed:', e)
  }
}

// ── Termii SMS ────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget SMS via `send-sms` edge function.
 * The function looks up the recipient's phone number server-side.
 * Gracefully skips if the user has no phone on file.
 */
export async function sendSms(
  toUserId: string,
  message:  string,
): Promise<void> {
  try {
    await supabase.functions.invoke('send-sms', {
      body: { to_user_id: toUserId, message },
    })
  } catch (e) {
    console.warn('[Termii] sendSms failed:', e)
  }
}

// ── Unified helper ────────────────────────────────────────────────────────────

/**
 * notify() — sends BOTH a push notification AND an SMS concurrently.
 * Use this everywhere instead of calling sendPush/sendSms individually.
 *
 * SMS text = `${title}: ${message}` (compact, under 160 chars)
 */
export async function notify(
  toUserId: string,
  title:    string,
  message:  string,
  url?:     string,
): Promise<void> {
  const smsText = `MyExpert: ${title} — ${message}`.slice(0, 160)
  await Promise.allSettled([
    sendPush(toUserId, title, message, url),
    sendSms(toUserId, smsText),
  ])
}
