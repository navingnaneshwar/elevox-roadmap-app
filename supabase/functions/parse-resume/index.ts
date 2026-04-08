import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const TAVILY_API_KEY     = Deno.env.get('TAVILY_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Tavily Extract ─────────────────────────────────────────────────────────
// Uses Tavily's /extract endpoint to fetch and parse content from a URL.
// Works for LinkedIn profiles, personal websites, etc.
async function extractUrlContent(url: string): Promise<string> {
  const res = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      urls: [url],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tavily extract failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  // Tavily returns { results: [{ url, raw_content, ... }] }
  const result = data?.results?.[0]
  const extracted = result?.raw_content || result?.content || ''

  if (!extracted || extracted.trim().length < 50) {
    throw new Error(
      'Could not extract content from the LinkedIn URL. ' +
      'LinkedIn may require login to view this profile. ' +
      'Please also upload your resume PDF for best results.'
    )
  }

  return extracted.trim()
}

// ── Main handler ───────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { text, url } = await req.json()

    if (!text && !url) {
      return new Response(
        JSON.stringify({ error: 'Please upload your resume or provide a LinkedIn URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the context for Claude from all available sources
    let content = ''

    // 1. Resume PDF text (if uploaded)
    if (text && text.trim().length > 50) {
      content += `=== RESUME / CV ===\n${text.trim()}\n\n`
    }

    // 2. LinkedIn profile — scrape via Tavily Extract
    if (url && url.trim()) {
      try {
        console.log(`Extracting LinkedIn content from: ${url}`)
        const linkedInContent = await extractUrlContent(url.trim())
        content += `=== LINKEDIN PROFILE (${url}) ===\n${linkedInContent}\n\n`
      } catch (e) {
        // If Tavily fails but we have resume text, log and continue
        console.warn('LinkedIn extraction failed:', e instanceof Error ? e.message : e)
        if (!content) {
          // No resume either — surface the error
          throw e
        }
        content += `=== NOTE ===\nLinkedIn URL provided (${url}) but could not be accessed.\n\n`
      }
    }

    // Protect against massive payloads
    const safeText = content.substring(0, 30000)

    const systemPrompt = `You are an elite executive brand strategist. Extract information from the following source material (resume PDF text and/or LinkedIn profile content) and map it IN STRICT JSON FORMAT to an onboarding questionnaire.

INSTRUCTIONS:
- Extract the following fields from the available content.
- If a field cannot be found or reasonably inferred, return an empty string "".
- DO NOT fabricate information. Only use what is in the source material.
- Your output must be raw, valid JSON only — no markdown, no explanation.

REQUIRED SCHEMA:
{
  "fullName": "Executive's full name",
  "currentTitle": "Current job title",
  "company": "Current company name",
  "industry": "Industry (e.g. Enterprise SaaS, FinTech, Healthcare Tech)",
  "location": "City, Country",
  "careerSummary": "A 3-5 sentence narrative of their career arc based on their timeline.",
  "biggestWin": "The biggest career achievement found in the text.",
  "topicsOwned": "5-10 specific topics they have deep expertise in, comma-separated.",
  "associations": "Prestigious universities, companies, or organizations they are associated with.",
  "email": "Email address if found",
  "phone": "Phone number if found"
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
      const errorText = await res.text()
      throw new Error(`Anthropic API error: ${errorText}`)
    }

    const aiData = await res.json()
    const raw = aiData.content[0].text
    const rawCleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsedData: Record<string, string>
    try {
      parsedData = JSON.parse(rawCleaned)
    } catch {
      console.error('Claude returned non-JSON:', rawCleaned.slice(0, 300))
      throw new Error('Could not parse profile data from the provided content. Please ensure your resume is a readable PDF.')
    }

    // Always persist the LinkedIn URL the user entered
    if (url) parsedData.linkedinUrl = url.trim()

    return new Response(
      JSON.stringify({ data: parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('parse-resume error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
