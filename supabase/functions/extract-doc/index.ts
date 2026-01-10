// Edge Function: Document text extraction
// - Accepts JSON POST with { publicUrl, documentId } OR { publicUrl }
// - Downloads the file from the provided URL
// - For text/* returns the file content
// - For PDFs/images: if OCR_SPACE_API_KEY is configured, calls OCR.space to extract text
// - If SUPABASE_SERVICE_ROLE_KEY is configured, updates the decision_documents row's extracted_text

// @ts-ignore: Deno std import
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

declare const Deno: any

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const publicUrl = body?.publicUrl || body?.url
    const documentId = body?.documentId || body?.docId || null

    if (!publicUrl) {
      return new Response(JSON.stringify({ error: 'Missing publicUrl' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch the file
    const fileRes = await fetch(publicUrl)
    if (!fileRes.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch file: ${fileRes.status}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const contentType = (fileRes.headers.get('content-type') || '').toLowerCase()

    let extractedText: string | null = null

    // If it's a plain text file, read text directly
    if (contentType.startsWith('text/')) {
      extractedText = await fileRes.text()
    } else if (contentType.includes('pdf') || contentType.startsWith('image/')) {
      // Use OCR.space if configured
      const ocrApiKey = (typeof Deno !== 'undefined' && Deno && Deno.env && typeof Deno.env.get === 'function')
        ? Deno.env.get('OCR_SPACE_API_KEY')
        : (typeof process !== 'undefined' && process?.env ? process.env.OCR_SPACE_API_KEY : undefined)

      if (!ocrApiKey) {
        return new Response(JSON.stringify({ error: 'OCR not configured on server. Set OCR_SPACE_API_KEY to enable PDF/image extraction.' }), { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Call OCR.space using the public URL (simpler than uploading the bytes)
      const form = new FormData()
      form.append('apikey', ocrApiKey)
      form.append('url', publicUrl)
      form.append('isOverlayRequired', 'false')

      const ocrRes = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: form })
      if (!ocrRes.ok) {
        const text = await ocrRes.text()
        return new Response(JSON.stringify({ error: `OCR provider error: ${ocrRes.status}`, detail: text }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const ocrJson = await ocrRes.json()
      // Combine ParsedText from all results
      extractedText = (ocrJson?.ParsedResults || []).map((p: any) => p?.ParsedText || '').join('\n').trim() || null
    } else {
      // Unknown content type. Try to read as text as a fallback
      try {
        extractedText = await fileRes.text()
      } catch (err) {
        console.warn('Unsupported content type and failed to read as text', contentType, err)
        extractedText = null
      }
    }

    // If Supabase service role is present, update the decision_documents table
    const SUPABASE_URL = (typeof Deno !== 'undefined' && Deno && Deno.env && typeof Deno.env.get === 'function')
      ? Deno.env.get('SUPABASE_URL')
      : (typeof process !== 'undefined' && process?.env ? process.env.SUPABASE_URL : undefined)
    const SUPABASE_SERVICE_ROLE_KEY = (typeof Deno !== 'undefined' && Deno && Deno.env && typeof Deno.env.get === 'function')
      ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      : (typeof process !== 'undefined' && process?.env ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined)

    let dbUpdated = false
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && extractedText !== null) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        if (documentId) {
          const { error } = await supabase.from('decision_documents').update({ extracted_text: extractedText }).eq('id', documentId)
          if (error) console.warn('Failed to update document by id', error)
          else dbUpdated = true
        } else {
          // Try to update by file_url matching the publicUrl
          const { error } = await supabase.from('decision_documents').update({ extracted_text: extractedText }).eq('file_url', publicUrl)
          if (error) console.warn('Failed to update document by file_url', error)
          else dbUpdated = true
        }
      } catch (err) {
        console.warn('Supabase update failed', err)
      }
    }

    return new Response(JSON.stringify({ extracted_text: extractedText, db_updated: dbUpdated }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Extractor error', error)
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
