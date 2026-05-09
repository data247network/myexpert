/**
 * send-sms — Supabase Edge Function
 *
 * Sends an SMS to a user via Termii (Nigerian SMS gateway).
 * Looks up the recipient's phone number server-side so the client
 * never needs to pass raw phone numbers.
 *
 * Body: { to_user_id: string, message: string }
 *
 * Required secrets:
 *   TERMII_API_KEY    (API Key from Termii dashboard)
 *   TERMII_SENDER_ID  (registered sender ID, e.g. "MyExpert" — defaults to "N-Alert")
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Normalise Nigerian phone numbers to international format (2348XXXXXXXXX) */
function toE164Nigeria(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length === 13) return digits
  if (digits.startsWith('0')   && digits.length === 11) return '234' + digits.slice(1)
  if (digits.startsWith('7')   && digits.length === 10) return '234' + digits
  if (digits.startsWith('8')   && digits.length === 10) return '234' + digits
  if (digits.startsWith('9')   && digits.length === 10) return '234' + digits
  return null // unrecognised format — skip
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Authenticate caller ────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authErr } = await anonClient.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────
    const { to_user_id, message } = await req.json() as {
      to_user_id: string
      message:    string
    }
    if (!to_user_id || !message) {
      return new Response(JSON.stringify({ error: 'Missing to_user_id or message' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (to_user_id === user.id) {
      return new Response(JSON.stringify({ ok: true, skipped: 'self' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 3. Look up recipient phone (service role bypasses RLS) ────────────
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('phone')
      .eq('id', to_user_id)
      .single()

    if (!profile?.phone) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const phone = toE164Nigeria(profile.phone)
    if (!phone) {
      return new Response(JSON.stringify({ ok: true, skipped: 'invalid_phone', raw: profile.phone }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Termii secrets ─────────────────────────────────────────────────
    const TERMII_API_KEY   = Deno.env.get('TERMII_API_KEY')
    const TERMII_SENDER_ID = Deno.env.get('TERMII_SENDER_ID') ?? 'N-Alert'
    const TERMII_BASE_URL  = 'https://v3.api.termii.com'

    if (!TERMII_API_KEY) {
      return new Response(JSON.stringify({ ok: true, skipped: 'not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 5. Send SMS ───────────────────────────────────────────────────────
    const tRes = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to:      phone,
        from:    TERMII_SENDER_ID,
        sms:     message,
        type:    'plain',
        channel: 'generic',   // use 'dnd' if primary channel fails for DND numbers
      }),
    })

    const tData = await tRes.json()

    // If generic channel blocked (DND), retry on dnd channel
    if (!tRes.ok || tData?.code === 'ok' === false) {
      const tResDnd = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TERMII_API_KEY,
          to:      phone,
          from:    TERMII_SENDER_ID,
          sms:     message,
          type:    'plain',
          channel: 'dnd',
        }),
      })
      const tDataDnd = await tResDnd.json()
      return new Response(JSON.stringify({ ok: true, termii: tDataDnd, channel: 'dnd' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, termii: tData, channel: 'generic' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[send-sms]', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
