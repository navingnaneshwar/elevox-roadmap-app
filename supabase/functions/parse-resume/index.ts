import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Migrated to Anthropic Claude
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { text, url } = await req.json()

    // A LinkedIn URL alone cannot be scraped — Claude has no browser access.
    // Require actual resume text. If only a URL was provided, return a clean
    // error so the frontend can show a helpful message rather than crashing.
    const hasResumeText = text && text.trim().length > 50
    if (!hasResumeText) {
      return new Response(
        JSON.stringify({
          error: 'Please upload your resume (PDF) to auto-fill the form. LinkedIn URL alone cannot be processed — we cannot access LinkedIn on your behalf.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let content = text
    if (url) content += `\nLinkedIn Profile URL: ${url}`

    // Protect against massive files crashing the prompt
    const safeText = content.substring(0, 25000)

    const systemPrompt = `You are an elite executive brand strategist. Your task is to extract information from the following source material (a resume PDF or LinkedIn profile text) and map it IN STRICT JSON FORMAT to an onboarding questionnaire.

INSTRUCTIONS:
Extract the following fields. If a field is not present or cannot be reasonably inferred from the text, return an empty string "". DO NOT make up information.
Your output must be raw, valid JSON.

REQUIRED SCHEMA (JSON only):
{
  "fullName": "Executive's full name",
  "currentTitle": "Current job title",
  "company": "Current company name",
  "industry": "Industry (e.g. Enterprise SaaS, FinTech, Healthcare)",
  "location": "City, Country",
  "careerSummary": "A 3-5 sentence complete narrative of their career arc based on their timeline.",
  "biggestWin": "The biggest career achievement found in the text (look at bullet points).",
  "topicsOwned": "List 5-10 specific topics they have deep expertise in based on their experience.",
  "associations": "Prestigious universities, companies, or organizations they are associated with."
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 2000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: safeText }],
      }),
    })

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Anthropic API error: ${errorText}`);
    }

    const data = await res.json()
    const raw = data.content[0].text
    const rawCleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsedData: Record<string, string>
    try {
      parsedData = JSON.parse(rawCleaned)
    } catch {
      console.error('Claude returned non-JSON:', rawCleaned.slice(0, 200))
      throw new Error('Could not extract profile data. Please upload a resume PDF for best results.')
    }

    // Append the linkedin URL if it was provided
    if (url) {
      parsedData.linkedinUrl = url
    }

    return new Response(
      JSON.stringify({ data: parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error("Parse Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
