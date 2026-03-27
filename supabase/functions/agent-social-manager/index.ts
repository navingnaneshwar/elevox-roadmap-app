import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { job_id, draft_id } = await req.json();

    if (!draft_id) {
      throw new Error('Missing draft_id in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Social Manager] Starting job ${job_id} for draft ${draft_id}`);

    // 1. Fetch Draft and Framework Data
    const { data: draft, error: draftError } = await supabase
      .from('content_drafts')
      .select('*, brand_frameworks(*)')
      .eq('id', draft_id)
      .single();

    if (draftError || !draft) throw new Error(`Draft fetch failed: ${draftError?.message}`);

    const userId = draft.user_id;

    if (draft.status !== 'approved') {
      throw new Error(`Draft ${draft_id} is not approved for scheduling.`);
    }

    // 2. Determine publish date — 24 hours from now to allow manual review buffer
    const publishDate = new Date();
    publishDate.setHours(publishDate.getHours() + 24);

    // 3. Insert into content_calendar
    const { data: calendarRow, error: insertError } = await supabase
      .from('content_calendar')
      .insert({
        user_id: userId,
        draft_id: draft_id,
        publish_date: publishDate.toISOString(),
        status: 'scheduled',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Update draft status to 'scheduled'
    await supabase.from('content_drafts').update({ status: 'scheduled' }).eq('id', draft_id);

    // 5. Audit log
    await supabase.from('agent_audit_logs').insert({
      user_id: userId,
      agent_role: 'agent-social-manager',
      event_type: 'post_scheduled',
      trigger_entity_id: calendarRow.id,
      prompt_context: { system: 'Rule-based routing. No LLM.', user: `Draft ID: ${draft_id}` },
      response_output: `Scheduled for ${publishDate.toISOString()} on platform ${draft.platform}`,
    });

    console.log(`[Social Manager] Successfully scheduled draft ${draft_id}. Calendar event: ${calendarRow.id}`);

    return new Response(JSON.stringify({ success: true, calendar_event: calendarRow }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[Social Manager] Fatal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
