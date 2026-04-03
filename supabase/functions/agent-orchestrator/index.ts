import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { StateGraph, START, END, MemorySaver } from 'npm:@langchain/langgraph';

// Configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Batch size limited to 1-3 to avoid total execution timeout, though LangGraph is deterministic.
const BATCH_SIZE = 3;

// ─────────────────────────────────────────────────────────────
// STEP 1 — Plan access map
// ─────────────────────────────────────────────────────────────
const JOB_PLAN_REQUIREMENTS: Record<string, string> = {
  sweep_industry:      'starter',   // Analyst    → pre-Chanakya market intel (S5-02)
  run_discovery_sweep: 'starter',
  gather_intelligence: 'starter',   // Chanakya Stage 1 — clarification questions (S5-03)
  build_framework:     'starter',   // Chanakya Stage 2 — full framework
  run_news_sweep:      'authority', // Analyst    → Phase 3 (Content Engine)
  reserve_slot:        'authority', // Machiavelli → Phase 3 (pre-slot)
  generate_drafts:     'authority', // Shakespeare → Phase 3 (Content Engine)
  review_draft:        'authority', // Aristotle   → Phase 3 (Content Engine)
  schedule_post:       'authority', // Machiavelli → Phase 4 (Visibility)
}

const PLAN_RANK: Record<string, number> = {
  starter:   1,
  authority: 2,
  legacy:    3,
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — Plan enforcement helper
// ─────────────────────────────────────────────────────────────
async function checkJobPlanAccess(
  supabaseAdmin: any,
  job: { id: string; job_type: string; user_id: string }
): Promise<{ allowed: boolean; reason?: string }> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('plan, plan_status')
    .eq('id', job.user_id)
    .single()

  if (error || !profile) return { allowed: false, reason: `profile_not_found: could not read plan for user ${job.user_id}` }
  if (profile.plan_status === 'past_due') return { allowed: false, reason: 'payment_required: account is past due' }

  const requiredPlan = JOB_PLAN_REQUIREMENTS[job.job_type]
  if (!requiredPlan) return { allowed: false, reason: `unknown_job_type: '${job.job_type}' is not a recognised job type` }

  const userRank     = PLAN_RANK[profile.plan]     ?? 0
  const requiredRank = PLAN_RANK[requiredPlan]     ?? 999

  if (userRank < requiredRank) {
    return { allowed: false, reason: `plan_required: job type '${job.job_type}' requires '${requiredPlan}' plan. User has '${profile.plan}'.` }
  }

  return { allowed: true }
}

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

    // 2. Lock jobs
    const jobIds = jobs.map(j => j.id);
    await supabase.from('agent_jobs')
      .update({ status: 'processing', locked_at: new Date().toISOString() })
      .in('id', jobIds);

    // -------------------------------------------------------------
    // LANGGRAPH SETUP
    // -------------------------------------------------------------
    
    // Define State schema channels
    const graphStateChannels = {
        job_id: { value: (x: any, y: any) => y ?? x, default: () => '' },
        job_type: { value: (x: any, y: any) => y ?? x, default: () => '' },
        user_id: { value: (x: any, y: any) => y ?? x, default: () => '' },
        payload: { value: (x: any, y: any) => y ?? x, default: () => ({}) },
        results: { value: (x: any[], y: any[]) => x.concat(y || []), default: () => [] },
        error: { value: (x: any, y: any) => y ?? x, default: () => null }
    };

    // Generic Edge Function Invoker (raw fetch — avoids SDK wrapper)
    const invokeNode = async (functionName: string, state: any) => {
        console.log(`[LangGraph] Node: executing ${functionName}`);
        const payload = { job_id: state.job_id, job_type: state.job_type, user_id: state.user_id, ...state.payload };

        const response = await fetch(
            `${supabaseUrl}/functions/v1/${functionName}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[LangGraph] Node Error (${functionName}): ${response.status} ${errText}`);
            return { error: `${functionName} returned ${response.status}: ${errText}` };
        }

        const data = await response.json();
        return { results: [{ node: functionName, data }] };
    };

    // 3. Define Nodes
    const strategistNode = async (state: any) => await invokeNode('agent-strategist', state);
    
    const analystNode = async (state: any) => await invokeNode('agent-analyst', state);
    
    // When Shakespeare finishes, Editor needs draft_id in the payload to evaluate it.
    // However, when piping sequentially, Editor only receives the ORIGINAL payload of the job.
    // The Editor wrapper extracts draft_id from shakespeare's emitted result to ensure it works.
    const shakespeareNode = async (state: any) => await invokeNode('agent-shakespeare', state);
    
    const aristotleNode = async (state: any) => {
        const shakeResult = state.results.find((r: any) => r.node === 'agent-shakespeare');
        if (shakeResult && shakeResult.data?.draft?.id) {
            state.payload = { ...state.payload, draft_id: shakeResult.data.draft.id };
        }
        return await invokeNode('agent-aristotle', state);
    };

    const machiavelliNode = async (state: any) => {
        // payload should already have draft_id if it passed aristotleNode in sequential loop
        // If triggered independently, the job payload natively contains draft_id
        return await invokeNode('agent-machiavelli', state);
    };

    // 4. Define Routing Logic
    const routeInitialJob = (state: any) => {
        const typeMap: Record<string, string> = {
            'sweep_industry':      'analyst',      // S5-02: pre-Chanakya industry sweep
            'run_discovery_sweep': 'analyst',
            'gather_intelligence': 'strategist',   // S5-03: Chanakya Stage 1 clarification
            'build_framework':     'strategist',
            'run_news_sweep':      'analyst',
            'reserve_slot':        'machiavelli',
            'generate_drafts':     'shakespeare',
            'review_draft':        'aristotle',
            'schedule_post':       'machiavelli'
        };
        const route = typeMap[state.job_type] || END;
        console.log(`[Orchestrator] job_type: ${state.job_type} → routing to: ${route}`);
        return route;
    };

    const aristotleToMachiavelli = (state: any) => {
        // Only route to Machiavelli if Aristotle strictly approved the content
        const aristotleResult = state.results.find((r: any) => r.node === 'agent-aristotle');
        if (aristotleResult && aristotleResult.data?.verdict === 'approved') {
            return "machiavelli";
        }
        return END;
    };

    // 5. Compile the StateGraph
    const workflow = new StateGraph({ channels: graphStateChannels })
        .addNode("strategist", strategistNode)
        .addNode("analyst", analystNode)
        .addNode("shakespeare", shakespeareNode)
        .addNode("aristotle", aristotleNode)
        .addNode("machiavelli", machiavelliNode)
        
        // Conditional initial routing
        .addConditionalEdges(START, routeInitialJob)
        
        // Explicit Graph Pipelines
        .addEdge("strategist", END)
        .addEdge("analyst", END)
        
        // Shakespeare automatically pipes to Aristotle!
        .addEdge("shakespeare", "aristotle") 
        
        // Aristotle evaluates. If passed, pipes to Machiavelli! Else dies.
        .addConditionalEdges("aristotle", aristotleToMachiavelli, {
            "machiavelli": "machiavelli",
            [END]: END
        })
        .addEdge("machiavelli", END);

    const checkpointer = new MemorySaver();
    const app = workflow.compile({ checkpointer });

    const processedResults = [];

    // -------------------------------------------------------------
    // EXECUTE GRAPH BATCH
    // -------------------------------------------------------------
    
    for (const job of jobs) {
      const { id, job_type, payload, user_id } = job;
      
      try {
        console.log(`[Orchestrator] Evaluating Job ${id} (${job_type}) for user ${user_id}...`);
        
        // ── PLAN GUARD ──────────────────────────────────────────────
        const access = await checkJobPlanAccess(supabase, { id, job_type, user_id });

        if (!access.allowed) {
          await supabase.from('agent_jobs').update({
            status:     'failed',
            error_logs: access.reason ?? 'plan_check_failed',
          }).eq('id', id);

          console.warn(`[Orchestrator] Job ${id} rejected: ${access.reason}`);
          processedResults.push({ id, status: 'failed', error: access.reason });
          continue;
        }
        // ── END PLAN GUARD ──────────────────────────────────────────

        console.log(`[Orchestrator] Invoking LangGraph for Job ${id}...`);
        
        const config = { configurable: { thread_id: id } };
        
        const initialState = {
            job_id: id,
            job_type,
            user_id,
            payload: payload || {}
        };

        const finalState = await app.invoke(initialState, config);

        if (finalState.error) throw new Error(finalState.error);

        // Success: Status -> Complete
        await supabase.from('agent_jobs').update({ status: 'complete' }).eq('id', id);
        processedResults.push({ id, status: 'complete', pipeline: finalState.results });

      } catch (jobErr: any) {
        console.error(`[Orchestrator] Job ${id} failed in LangGraph:`, jobErr);
        // Mark failed
        await supabase.from('agent_jobs').update({ 
          status: 'failed', 
          error_logs: jobErr.message || JSON.stringify(jobErr) 
        }).eq('id', id);
        processedResults.push({ id, status: 'failed', error: jobErr.message });
      }
    }

    return new Response(JSON.stringify({ processed: processedResults }), { 
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
