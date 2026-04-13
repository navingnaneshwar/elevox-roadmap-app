import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────
// HELPER — Find next available calendar slot for a user/platform
// ─────────────────────────────────────────────────────────────
async function findNextSlot(
  supabase: any,
  userId: string,
  platform: string,
  timezone: string,
  maxPerDay: number
): Promise<string> {
  // Walk forward day by day until we find a date that has fewer
  // than maxPerDay slots already reserved/scheduled
  const candidate = new Date();
  candidate.setHours(candidate.getHours() + 1, 0, 0, 0); // start from next whole hour

  for (let attempt = 0; attempt < 30; attempt++) {
    const dayStart = new Date(candidate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(candidate);
    dayEnd.setHours(23, 59, 59, 999);

    const { count } = await supabase
      .from('content_calendar')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('platform', platform)
      .in('status', ['reserved', 'scheduled'])
      .gte('scheduled_at', dayStart.toISOString())
      .lte('scheduled_at', dayEnd.toISOString());

    if ((count ?? 0) < maxPerDay) {
      // Prefer 9 AM in the user's timezone — approximate via UTC offset
      candidate.setHours(9, 0, 0, 0);
      return candidate.toISOString();
    }

    // Try the next day
    candidate.setDate(candidate.getDate() + 1);
    candidate.setHours(9, 0, 0, 0);
  }

  // Fallback: 30 days out (should never be reached in practice)
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  fallback.setHours(9, 0, 0, 0);
  return fallback.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Internal service-to-service call — authenticated via service role key
  // No JWT user validation needed for agent-to-agent calls
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const { job_id, draft_id, framework_id, briefing_id, mode, calendar_event_id: payloadCalendarEventId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── MODE 1: reserve — lock a calendar slot BEFORE draft is written ──
    if (mode === 'reserve' || !draft_id) {
      if (!framework_id) throw new Error('Missing framework_id for reserve mode');

      console.log(`[Machiavelli] Reserve mode — job ${job_id}, framework ${framework_id}`);

      const { data: framework, error: fwErr } = await supabase
        .from('brand_frameworks')
        .select('*, profiles(*)')
        .eq('id', framework_id)
        .single();

      if (fwErr || !framework) throw new Error(`Framework fetch failed: ${fwErr?.message}`);

      const profile   = framework.profiles;
      const timezone  = profile.timezone ?? 'Asia/Kolkata';
      const platform  = 'linkedin';
      const maxPerDay = profile.posting_frequency ?? 1;

      const scheduledAt = await findNextSlot(supabase, profile.id, platform, timezone, maxPerDay);

      const { data: calendarRow, error: calErr } = await supabase
        .from('content_calendar')
        .insert({
          user_id:      profile.id,
          platform,
          content_type: 'text',
          title:        `LinkedIn post — ${new Date(scheduledAt).toLocaleDateString('en-US', {
                          timeZone: timezone,
                          weekday:  'long',
                          month:    'short',
                          day:      'numeric',
                        })}`,
          scheduled_at: scheduledAt,
          timezone,
          local_time:   new Date(scheduledAt).toLocaleString('en-US', { timeZone: timezone }),
          status:       'reserved',
          ai_generated: true,
        })
        .select()
        .single();

      if (calErr || !calendarRow) throw new Error(`Calendar insert failed: ${calErr?.message}`);

      // Queue Shakespeare with the reserved slot id so it can attach the draft later
      await supabase.from('agent_jobs').insert({
        user_id:  profile.id,
        job_type: 'generate_drafts',
        payload:  {
          framework_id,
          briefing_id:       briefing_id ?? null,
          calendar_event_id: calendarRow.id,
        },
      });

      console.log(`[Machiavelli] Reserved slot ${calendarRow.id} at ${scheduledAt} — queued Shakespeare`);

      return new Response(
        JSON.stringify({ success: true, calendar_event_id: calendarRow.id, scheduled_at: scheduledAt }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ── MODE 2: schedule_post — attach approved draft to calendar slot ──
    if (!draft_id) throw new Error('Missing draft_id in payload');

    console.log(`[Machiavelli] Schedule mode — job ${job_id} for draft ${draft_id}`);

    // 1. Fetch Draft and Framework Data
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('*, brand_frameworks(*)')
      .eq('id', draft_id)
      .single();

    if (draftError || !draft) throw new Error(`Draft fetch failed: ${draftError?.message}`);

    const framework = draft.brand_frameworks;
    const userId = draft.user_id;

    // S5-00: Removed approved_for_publish check — Aristotle is the gate.
    // If a schedule_post job exists in the queue, Aristotle already approved it.
    // Machiavelli's sole responsibility is WHEN and WHERE, not WHETHER.

    // 3. Update the pre-reserved calendar slot → confirmed/scheduled
    // ISS-038 fix: calendar_event_id lives in the orchestrator job payload, NOT on the
    // content_drafts row (that column doesn't exist). Read from the request payload directly.
    const scheduledAt = new Date();
    scheduledAt.setHours(scheduledAt.getHours() + 24);

    const calendarEventId = payloadCalendarEventId ?? null;

    if (!calendarEventId) throw new Error(`Job ${job_id} has no calendar_event_id in payload — Machiavelli reserve mode must run first`);

    const { data: calendarRow, error: updateCalError } = await supabase
      .from('content_calendar')
      .update({
        draft_id:     draft_id,
        scheduled_at: scheduledAt.toISOString(),
        status:       'scheduled',
      })
      .eq('id', calendarEventId)
      .select()
      .single();

    if (updateCalError) throw updateCalError;
    // ISS-038 fix: guard against update matching 0 rows (wrong ID, already deleted, etc.)
    if (!calendarRow) throw new Error(`Calendar update matched 0 rows for event ${calendarEventId} — slot may have been deleted or ID mismatch`);
    console.log(`[Machiavelli] Updated slot ${calendarEventId} → status=scheduled`);

    // 4. Update the draft status to 'scheduled'
    await supabase.from('content_drafts').update({ status: 'scheduled' }).eq('id', draft_id);

    // 5. Audit Log
    await supabase.from('agent_audit_logs').insert({
        user_id: userId,
        agent_role: 'agent-machiavelli',
        event_type: 'post_scheduled',
        trigger_entity_id: calendarRow.id,
        prompt_context: { system: "Rule-based routing (No LLM). Scheduled based on queue slot.", user: `Draft ID: ${draft_id}` },
        response_output: `Scheduled for ${scheduledAt.toISOString()} on platform ${draft.platform}`
    });

    console.log(`[Machiavelli] Successfully scheduled draft ${draft_id}. Event: ${calendarRow.id}`);

    return new Response(JSON.stringify({ success: true, calendar_event: calendarRow }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (error: any) {
    console.error(`[Machiavelli] Fatal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});


