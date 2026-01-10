// Edge Function: Access decision documents
// - Accepts GET request with query params: decisionId (required)
// - Returns array of documents (file_name, file_url, extracted_text, created_at) from decision_documents table
// - Uses Supabase anon key to respect RLS (user can only see their own documents)
// - Requires SUPABASE_URL and SUPABASE_ANON_KEY env vars (auto-provided by Supabase)

// @ts-ignore: Deno std import
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
// @ts-ignore: Supabase ESM import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse query parameters
    const url = new URL(req.url)
    const decisionId = url.searchParams.get('decisionId')
    
    if (!decisionId) {
      return new Response(JSON.stringify({ error: 'Missing decisionId query parameter' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Get Supabase credentials from Deno environment
    // These are automatically set by Supabase when you deploy
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ error: 'Supabase credentials not configured on server' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Create Supabase client with anon key
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Get auth token from request header to respect RLS
    const authHeader = req.headers.get('authorization') || ''
    let supabaseClient = supabase
    
    // If Authorization header is provided, create a client with the session token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })
    }

    // Fetch documents for this decision
    const { data, error } = await supabaseClient
      .from('decision_documents')
      .select('id, file_name, file_url, extracted_text, created_at')
      .eq('decision_id', decisionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch documents', error)
      return new Response(JSON.stringify({ error: error.message || 'Failed to fetch documents', details: error }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ documents: data || [], count: (data || []).length }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Access docs error', error)
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
