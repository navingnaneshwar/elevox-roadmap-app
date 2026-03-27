import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum number of jobs to process per orchestrator tick to prevent Edge Function timeout (30s)
const BATCH_SIZE = 3;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch pending jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('agent_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending jobs.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // 2. Mark as processing to prevent other cron ticks from double-processing
    const jobIds = jobs.map(j => j.id);
    await supabase.from('agent_jobs')
      .update({ status: 'processing', locked_at: new Date().toISOString() })
      .in('id', jobIds);

    const results = [];

    // 3. Dispatch to specific agents sequentially to avoid rate-limiting OpenAI
    for (const job of jobs) {
      const { id, job_type, payload } = job;
      
      try {
        let functionName = '';
        
        switch (job_type) {
          case 'build_framework':
            functionName = 'agent-strategist';
            break;
          case 'run_news_sweep':
            functionName = 'agent-analyst';
            break;
          case 'generate_drafts':
            functionName = 'agent-ghostwriter';
            break;
          case 'review_draft':
            functionName = 'agent-editor';
            break;
          case 'schedule_post':
            functionName = 'agent-social-manager';
            break;
          default:
            throw new Error(`Unknown job_type: ${job_type}`);
        }

        console.log(`[Orchestrator] Dispatching Job ${id} (${job_type}) to ${functionName}`);
        
        // Invoke the specialized Agent Edge Function
        // We pass the job_id so the agent can log to agent_audit_logs accurately
        const { data, error: invokeError } = await supabase.functions.invoke(functionName, {
          body: { job_id: id, ...payload },
        });

        if (invokeError) throw invokeError;

        // If the Agent succeeds, mark complete
        await supabase.from('agent_jobs').update({ status: 'complete' }).eq('id', id);
        results.push({ id, status: 'complete' });

      } catch (jobErr: any) {
        console.error(`[Orchestrator] Job ${id} failed:`, jobErr);
        // Mark failed so it can be reviewed or retried
        await supabase.from('agent_jobs').update({ 
          status: 'failed', 
          error_logs: jobErr.message || JSON.stringify(jobErr) 
        }).eq('id', id);
        results.push({ id, status: 'failed', error: jobErr.message });
      }
    }

    return new Response(JSON.stringify({ processed: results }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (error: any) {
    console.error(`[Orchestrator] Fatal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
