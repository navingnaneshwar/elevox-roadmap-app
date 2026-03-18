// supabase/functions/parse-resume/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { encode } from 'https://deno.land/std@0.177.0/encoding/base64.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const url = formData.get('url') as string | null

    let messagesContent: any[] = []

    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const base64Data = encode(uint8Array)
        
        messagesContent.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data
          }
        })
      } else {
        const text = await file.text()
        messagesContent.push({
          type: "text",
          text: `Source Document Text:\n${text.substring(0, 30000)}`
        })
      }
    } 
    
    if (url) {
      messagesContent.push({
        type: "text",
        text: `The executive's LinkedIn Profile URL is: ${url}.`
      })
    }

    if (messagesContent.length === 0) {
      throw new Error('No file or url provided')
    }

    const promptInstructions = `You are an elite executive brand strategist. Your task is to extract information from the provided source material (a resume PDF or LinkedIn profile text) and map it IN STRICT JSON FORMAT to an onboarding questionnaire.

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

    messagesContent.push({
      type: "text",
      text: promptInstructions
    })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: messagesContent }],
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
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
