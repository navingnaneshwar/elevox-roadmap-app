import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
Do not include any markdown styling like \`\`\`json around your response. Just the raw JSON object.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { job_id, framework_id } = await req.json();

    if (!job_id || !framework_id) {
      throw new Error('Missing job_id or framework_id in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAiKey = Deno.env.get('OPENAI_API_KEY')!;
    const tavilyKey = Deno.env.get('TAVILY_API_KEY')!;
    
    if (!tavilyKey) throw new Error("TAVILY_API_KEY not configured.");

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Analyst] Starting job ${job_id} for framework ${framework_id}`);

    // 1. Fetch Framework and Profile Data
    const { data: framework, error: fwError } = await supabase
      .from('brand_frameworks')
      .select('*, profiles(*)')
      .eq('id', framework_id)
      .single();

    if (fwError || !framework) {
      throw new Error(`Failed to fetch framework: ${fwError?.message}`);
    }

    const profile = framework.profiles;
    const userId = framework.user_id;

    // 2. Formulate a dynamic Web Search Query
    // We combine their industry and their first top content pillar to find highly relevant niche news
    const topPillar = framework.content_pillars && framework.content_pillars.length > 0 
        ? framework.content_pillars[0].title 
        : 'leadership';
    const searchQuery = `latest breaking news trends in ${profile.industry} regarding ${topPillar} this week`;

    console.log(`[Analyst] Executing Tavily Search: "${searchQuery}"`);
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        search_depth: 'advanced',
        include_images: false,
        max_results: 4,
      }),
    });

    if (!tavilyResponse.ok) {
        throw new Error(`Tavily Error: ${await tavilyResponse.text()}`);
    }

    const searchData = await tavilyResponse.json();
    const liveNewsContext = searchData.results.map((r: any) => 
        `Title: ${r.title}\nURL: ${r.url}\nContent Snippet: ${r.content}\n`
    ).join('---\n');

    // 3. Call OpenAI to analyze the news against the framework
    const userPrompt = `
      CXO BRAND FRAMEWORK:
      Archetype: ${framework.archetype}
      Voice Traits: ${JSON.stringify(framework.voice_traits)}
      Content Pillars: ${JSON.stringify(framework.content_pillars)}

      TODAY'S LIVE NEWS SOURCED FROM THE WEB:
      ${liveNewsContext}

      Analyze the live news against the CXO's framework. 
      Identify which articles present the strongest PR opportunity for them to post about.
      Generate the structured JSON briefing.
    `;

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: ANALYST_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!openAiResponse.ok) {
        throw new Error(`OpenAI Error: ${await openAiResponse.text()}`);
    }

    const openAiData = await openAiResponse.json();
    const rawOutput = openAiData.choices[0].message.content;
    const parsedBriefing = JSON.parse(rawOutput);

    // 4. Save to industry_briefings
    const { data: briefingRow, error: insertError } = await supabase
      .from('industry_briefings')
      .insert({
        user_id: userId,
        framework_id: framework_id,
        news_links: parsedBriefing.news_links,
        suggested_angles: parsedBriefing.suggested_angles
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Trace the action in agent_audit_logs
    await supabase.from('agent_audit_logs').insert({
        user_id: userId,
        agent_role: 'agent-analyst',
        event_type: 'briefing_generated',
        trigger_entity_id: briefingRow.id,
        prompt_context: { system: ANALYST_SYSTEM_PROMPT, user: userPrompt, search_query: searchQuery },
        response_output: rawOutput
    });

    // 6. Queue up the next step (generate_drafts)
    await supabase.from('agent_jobs').insert({
        user_id: userId,
        job_type: 'generate_drafts',
        payload: { framework_id: framework_id, briefing_id: briefingRow.id }
    });

    console.log(`[Analyst] Successfully built briefing ${briefingRow.id} and handed off to Ghostwriter`);

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
