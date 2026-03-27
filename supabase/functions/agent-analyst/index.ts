import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function applyUserEdits(supabase: any, framework: any): Promise<any> {
  const { data: edits } = await supabase
    .from('user_edits')
    .select('*')
    .eq('entity_id', framework.id)
    .eq('entity_type', 'framework')
    .order('created_at', { ascending: true });

  if (!edits || edits.length === 0) return framework;

  let patched = { ...framework };
  for (const edit of edits) {
    patched[edit.field_path] = edit.edited_value;
  }

  patched.user_edits_summary = edits
    .map((e: any) => ` ${e.field_path} changed to: ${JSON.stringify(e.edited_value)}${e.edit_note ? ` (reason: ${e.edit_note})` : ''}`)
    .join('\n');

  return patched;
}

const ANALYST_SYSTEM_PROMPT = `
You are an Elite Investigative Industry Analyst and Newsroom Editor.
Your job is to read a CXO's Brand Framework, and map it against today's breaking web news to find the strongest strategic angles for them to post about.
You extract the noise and find the signal.

You MUST respond strictly in valid JSON matching exactly this structure:
{
  "news_links": [
    { "title": "Headline of the article", "url": "Valid URL", "summary": "1 sentence summary" }
  ],
  "suggested_angles": [
    "Hot Take 1: How the CXO can uniquely comment on Article A based on their framework.",
    "Hot Take 2: Unconventional opinion the CXO should state about Trend B."
  ]
}
Do not include any markdown styling like triple-backtickjson around your response. Just the raw JSON object.
`;

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
    const { job_id, job_type, user_id, framework_id, linkedin, resume, industry } = await req.json();

    if (!job_id) {
      throw new Error('Missing job_id in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const tavilyKey = Deno.env.get('TAVILY_API_KEY')!;
    
    if (!tavilyKey) throw new Error("TAVILY_API_KEY not configured.");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // =====================================================================
    // MODE A: PRE-FRAMEWORK DISCOVERY SWEEP
    // =====================================================================
    if (job_type === 'run_discovery_sweep') {
        if (!user_id) throw new Error('Missing user_id for run_discovery_sweep');
        console.log(`[Analyst] Starting PRE-SWEEP job ${job_id} for user ${user_id}`);

        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user_id)
            .single();

        if (profileErr || !profile) throw new Error(`Failed to fetch profile: ${profileErr?.message}`);

        console.log(`[Analyst] Executing Broad Tavily Search for industry: ${profile.industry}`);
        
        // Broad search for executive leadership trends in their industry
        const query = `latest breaking news trends in ${profile.industry} for executive leadership this week`;
        
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: query,
            search_depth: 'advanced',
            include_images: false,
            max_results: 5,
          }),
        });
        
        if (!res.ok) throw new Error(`Tavily Error: ${await res.text()}`);
        
        const data = await res.json();
        const liveSignals = (data.results ?? []).map((r: any) => 
            `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}\n`
        ).join('---\n');

        // Audit Log for the sweep
        await supabase.from('agent_audit_logs').insert({
            user_id: user_id,
            agent_role: 'agent-analyst',
            event_type: 'discovery_sweep_completed',
            prompt_context: { search_queries: [query] },
            response_output: liveSignals
        });

        // Handoff to Chanakya (Strategist) to build the framework USING these signals
        await supabase.from('agent_jobs').insert({
            user_id: user_id,
            job_type: 'build_framework',
            payload: { linkedin, resume, industry, live_signals: liveSignals }
        });

        console.log(`[Analyst] Pre-sweep complete. Handed off to Strategist.`);
        return new Response(JSON.stringify({ success: true, live_signals: liveSignals }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    // =====================================================================
    // MODE B: POST-FRAMEWORK NEWS SWEEP (Current Behavior)
    // =====================================================================
    if (!framework_id) {
      throw new Error('Missing framework_id for run_news_sweep');
    }

    console.log(`[Analyst] Starting POST-SWEEP job ${job_id} for framework ${framework_id}`);

    // 1. Fetch Framework and Profile Data
    const { data: rawFramework, error: fwError } = await supabase
      .from('brand_frameworks')
      .select('*, profiles(*)')
      .eq('id', framework_id)
      .single();

    if (fwError || !rawFramework) {
      throw new Error(`Failed to fetch framework: ${fwError?.message}`);
    }

    const framework = await applyUserEdits(supabase, rawFramework);
    const fwProfile = framework.profiles;
    const fwUserId = framework.user_id;

    // 2. Formulate a dynamic Web Search Query
    console.log('[Analyst] Executing Parallel Tavily Searches for top pillars');
    // Run one Tavily search per content pillar (max 4 pillars to stay within limits)
    const pillarsToSearch = (framework.content_pillars ?? []).slice(0, 4);

    const searchResults = await Promise.all(
      pillarsToSearch.map(async (pillar: any) => {
        const query = `${fwProfile.full_name} industry: ${fwProfile.industry} topic: ${pillar.title} breaking news trends this week`;
        
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: 'advanced',
            include_images: false,
            max_results: 3,
          }),
        });
        const data = await res.json();
        return { pillar: pillar.title, results: data.results ?? [] };
      })
    );

    // Merge and deduplicate by URL
    const seen = new Set<string>();
    const liveNewsContext = searchResults
      .flatMap(({ pillar, results }) =>
        results
          .filter((r: any) => !seen.has(r.url) && seen.add(r.url))
          .map((r: any) => `[Pillar: ${pillar}]\nTitle: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}\n`)
      )
      .join('---\n');

    // 3. Call Anthropic to analyze the news against the framework
    const userPrompt = `
CXO BRAND FRAMEWORK:
Name: ${fwProfile.full_name}, ${fwProfile.current_title}
Industry: ${fwProfile.industry}
Archetype: ${framework.archetype}
Voice Traits: ${JSON.stringify(framework.voice_traits)}
Content Pillars: ${JSON.stringify(framework.content_pillars)}
Target Audiences: ${JSON.stringify(framework.target_audiences)}
Active Platforms: ${JSON.stringify(framework.platforms)}
Ghostwriting Rules: ${JSON.stringify(framework.ghostwriting_rules)}
Mentor Insights (for strategic context): ${JSON.stringify(framework.mentor_insights)}

USER EDITS APPLIED TO THIS FRAMEWORK:
${framework.user_edits_summary ?? 'None recorded'}

TODAY'S LIVE NEWS:
${liveNewsContext}

For each news angle you identify:
1. Name which content pillar it maps to
2. Name which platform it is best suited for
3. Name which target audience it speaks to
4. Write the angle in a voice that matches the ghostwriting rules above
`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: ANALYST_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
        throw new Error(`Anthropic Error: ${await anthropicResponse.text()}`);
    }

    const anthropicData = await anthropicResponse.json();
    const rawOutput = anthropicData.content[0].text;
    const parsedBriefing = JSON.parse(rawOutput);

    // 4. Save to industry_briefings
    const { data: briefingRow, error: insertError } = await supabase
      .from('industry_briefings')
      .insert({
        user_id: fwUserId,
        framework_id: framework_id,
        news_links: parsedBriefing.news_links,
        suggested_angles: parsedBriefing.suggested_angles
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Trace the action in agent_audit_logs
    await supabase.from('agent_audit_logs').insert({
        user_id: fwUserId,
        agent_role: 'agent-analyst',
        event_type: 'briefing_generated',
        trigger_entity_id: briefingRow.id,
        prompt_context: { 
            system: ANALYST_SYSTEM_PROMPT, 
            user: userPrompt, 
            search_queries: searchResults.map(r => r.pillar) 
        },
        response_output: rawOutput
    });

    // 6. Queue reserve_slot — Machiavelli locks a calendar slot BEFORE Shakespeare writes
    await supabase.from('agent_jobs').insert({
        user_id: fwUserId,
        job_type: 'reserve_slot',
        payload: { framework_id: framework_id, briefing_id: briefingRow.id }
    });

    console.log(`[Analyst] Successfully built briefing ${briefingRow.id} and queued Machiavelli to reserve slot`);

    return new Response(JSON.stringify({ success: true, briefing: briefingRow }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (error: any) {
    console.error(`[Analyst] Fatal error:`, error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
