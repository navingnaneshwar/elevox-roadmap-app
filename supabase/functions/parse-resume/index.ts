// supabase/functions/parse-resume/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Buffer } from 'node:buffer'
import pdf from 'npm:pdf-parse@1.1.1'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const url = formData.get('url') as string | null

    let extractedText = ""

    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const pdfData = await pdf(buffer)
        extractedText = pdfData.text
      } else {
        extractedText = await file.text()
      }
    } else if (url) {
      // In a production environment with a scraping API (like Proxycurl), 
      // you would fetch the LinkedIn profile data here. 
      // For now, we seed the URL for the LLM to process if we only have the URL.
      extractedText = `The executive's LinkedIn Profile URL is: ${url}. (No resume text was provided).`
    } else {
      throw new Error('No file or url provided')
    }

    // Protect against massive files crashing the prompt
    const safeText = extractedText.substring(0, 20000)

    const prompt = `You are an elite executive brand strategist. Your task is to extract information from the following source material (a resume PDF or LinkedIn profile text) and map it IN STRICT JSON FORMAT to an onboarding questionnaire.

SOURCE MATERIAL:
"""
${safeText}
"""

INSTRUCTIONS:
Extract the following fields. If a field is not present or cannot be reasonably inferred from the text, return an empty string "". DO NOT make up information.
Your output must be raw, valid JSON. DO NOT wrap it in backticks, do not include markdown \`\`\`json. Just the JSON object.

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
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Anthropic API error: ${errorText}`);
    }

    const data = await res.json()
    const raw = data.content[0]?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsedData = JSON.parse(clean)

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
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
