// supabase/functions/parse-resume/index.ts
// Extracts profile fields from a PDF resume or LinkedIn URL using OpenAI GPT-4o.
// pdf-parse/lib/pdf-parse.js imported directly — avoids the index.js wrapper
// that calls fs.readFileSync on test files at import time (crashes in Deno).
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore — npm specifier, not resolvable by local TS server
import pdfParse from 'npm:pdf-parse/lib/pdf-parse.js'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are an elite executive brand strategist. Extract information from the provided source material (a resume or LinkedIn profile) and map it to the following JSON schema. If a field cannot be reasonably inferred, return an empty string "". DO NOT make up information. Return only valid JSON.

{
  "fullName": "Executive's full name",
  "currentTitle": "Current job title",
  "company": "Current company name",
  "industry": "Industry (e.g. Enterprise SaaS, FinTech, Healthcare)",
  "location": "City, Country",
  "careerSummary": "A 3-5 sentence narrative of their career arc.",
  "biggestWin": "The biggest career achievement found in the text.",
  "topicsOwned": "5-10 specific topics they have deep expertise in.",
  "associations": "Prestigious universities, companies, or organisations they are associated with."
}`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const url  = formData.get('url')  as string | null

    let extractedText = ''

    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await pdfParse(new Uint8Array(arrayBuffer))
        extractedText = result.text
      } else {
        extractedText = await file.text()
      }
    }

    if (url) {
      extractedText += `\nLinkedIn Profile URL: ${url}`
    }

    if (!extractedText.trim()) {
      throw new Error('No file or URL provided')
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: extractedText.substring(0, 25000) },
        ],
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const data = await res.json()
    const parsedData = JSON.parse(data.choices[0]?.message?.content || '{}')

    if (url) parsedData.linkedinUrl = url

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
