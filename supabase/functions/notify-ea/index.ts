import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────
// notify-ea/index.ts
// Sprint 4 — P1 WhatsApp notification to EA
// Called by Aristotle when a draft is approved_for_publish=true
// and needs human review. Sends WhatsApp via Twilio.
// ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const { draft_id } = await req.json();
    if (!draft_id) throw new Error('Missing draft_id in payload');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase   = createClient(supabaseUrl, supabaseKey);

    const twilioSid   = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom  = Deno.env.get('TWILIO_WHATSAPP_FROM'); // e.g. whatsapp:+14155238886
    const appUrl      = Deno.env.get('APP_URL') ?? 'https://roadmap-app-gamma-seven.vercel.app';

    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.warn('[notify-ea] Twilio secrets not configured — skipping WhatsApp send');
      return new Response(
        JSON.stringify({ success: false, reason: 'twilio_not_configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ── Fetch draft + profile ─────────────────────────────────
    const { data: draft, error: draftErr } = await supabase
      .from('content_drafts')
      .select('*, brand_frameworks(*, profiles(*))')
      .eq('id', draft_id)
      .single();

    if (draftErr || !draft) throw new Error(`Draft fetch failed: ${draftErr?.message}`);

    const profile = draft.brand_frameworks?.profiles;
    const eaPhone = profile?.ea_phone; // e.g. +919876543210
    const eaName  = profile?.ea_name ?? 'EA';

    if (!eaPhone) {
      console.warn(`[notify-ea] No ea_phone on profile for user ${draft.user_id} — skipping`);
      return new Response(
        JSON.stringify({ success: false, reason: 'no_ea_phone' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ── Build message ─────────────────────────────────────────
    const firstLine = (draft.body_text ?? '')
      .split('\n')
      .find((l: string) => l.trim()) ?? 'New draft ready';

    const hookPreview = firstLine.length > 120
      ? firstLine.slice(0, 120) + '…'
      : firstLine;

    const cxScore   = draft.aristotle_cx_score          ?? '—';
    const credScore = draft.aristotle_credibility_score ?? '—';
    const compScore = draft.aristotle_composite_score   ?? '—';

    const message = [
      `✍️ *New LinkedIn draft ready for review*`,
      `*Executive:* ${profile?.full_name ?? 'Your CxO'}`,
      ``,
      `*Hook:* "${hookPreview}"`,
      ``,
      `*Aristotle scores:* CX ${cxScore}/100 · Credibility ${credScore}/100 · Composite ${compScore}/100`,
      ``,
      `Review & approve here:`,
      `${appUrl}/approvals`,
    ].join('\n');

    // ── Send via Twilio WhatsApp ──────────────────────────────
    const toNumber = `whatsapp:${eaPhone}`;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

    const body = new URLSearchParams({
      From: twilioFrom,
      To:   toNumber,
      Body: message,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error(`[notify-ea] Twilio error:`, twilioData);
      throw new Error(`Twilio send failed: ${twilioData.message}`);
    }

    console.log(`[notify-ea] WhatsApp sent to ${eaPhone} — SID: ${twilioData.sid}`);

    // ── Audit log ─────────────────────────────────────────────
    await supabase.from('agent_audit_logs').insert({
      user_id:           draft.user_id,
      agent_role:        'notify-ea',
      event_type:        'whatsapp_sent',
      trigger_entity_id: draft_id,
      prompt_context:    { to: eaPhone, message_preview: hookPreview },
      response_output:   twilioData.sid,
    });

    return new Response(
      JSON.stringify({ success: true, twilio_sid: twilioData.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error(`[notify-ea] Fatal error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
