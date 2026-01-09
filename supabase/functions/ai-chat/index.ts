// @ts-ignore: Deno std import (Edge runtime)
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

// Provide Deno global type for local TypeScript tooling
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get apikey or Authorization token from request headers
    const apikey = req.headers.get('apikey')
    const authHeader = req.headers.get('authorization')
    
    // Verify that at least one auth method is provided
    if (!apikey && !authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing API key or auth token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const { systemPrompt, userQuestion } = await req.json()
    
    // Validate input
    if (!systemPrompt || !userQuestion) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: systemPrompt and userQuestion" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Get Gemini API key from environment (set in Supabase dashboard)
    const geminiApiKey = (typeof Deno !== 'undefined' && Deno && Deno.env && typeof Deno.env.get === 'function')
      ? Deno.env.get("GEMINI_API_KEY")
      // @ts-ignore: process is not defined in Deno, but we check for it at runtime
      : (typeof process !== 'undefined' && process?.env ? process.env.GEMINI_API_KEY : undefined)
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY not configured")
      return new Response(
        JSON.stringify({
          error: "API key not configured on server",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\n---\n\nUser question: " + userQuestion }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.7,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text()
      console.error("Gemini API error", geminiRes.status, errorText)
      return new Response(
        JSON.stringify({
          error: `Gemini API error: ${geminiRes.status}`,
        }),
        {
          status: geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const payload = await geminiRes.json()
    const reply = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "No reply"

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
