/**
 * send-push  —  Supabase Edge Function
 *
 * Receives an authenticated request from the client and sends a OneSignal
 * web-push notification to another user identified by their Supabase UUID
 * (stored as OneSignal's external_id).
 *
 * Body: { to_user_id: string, title: string, message: string, url?: string }
 *
 * Required secrets (set via `supabase secrets set`):
 *   ONESIGNAL_APP_ID
 *   ONESIGNAL_API_KEY   (REST API key from OneSignal dashboard)
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Verify the caller is a signed-in user ──────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────
    const { to_user_id, title, message, url } = await req.json() as {
      to_user_id: string
      title:      string
      message:    string
      url?:       string
    }

    if (!to_user_id || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 3. Reject self-notifications (shouldn't happen, but guard anyway) ─
    if (to_user_id === user.id) {
      return new Response(JSON.stringify({ ok: true, skipped: 'self' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Send via OneSignal REST API ────────────────────────────────────
    const ONESIGNAL_APP_ID  = Deno.env.get('ONESIGNAL_APP_ID')
    const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY')

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      // Not configured — silently succeed so dev environments don't break
      return new Response(JSON.stringify({ ok: true, skipped: 'not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: Record<string, unknown> = {
      app_id:                          ONESIGNAL_APP_ID,
      include_external_user_ids:       [to_user_id],
      channel_for_external_user_ids:   'push',
      headings:                        { en: title },
      contents:                        { en: message },
      ios_badgeType:                   'Increase',
      ios_badgeCount:                  1,
    }
    if (url) payload.web_url = url

    const osRes = await fetch('https://onesignal.com/api/v1/notifications', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const osData = await osRes.json()

    return new Response(JSON.stringify({ ok: true, onesignal: osData }), {
      status:  osRes.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[send-push]', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status:  500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
