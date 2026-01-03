import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { image } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      console.log("No Gemini Key. Returning Mock Data.");
    }

    // 1. Prepare Base64 (Gemini expects raw base64 without the 'data:image...' header)
    const base64Clean = image.includes(',') ? image.split(',')[1] : image;

    console.log("Sending to Google Gemini 1.5 Flash...");

    // 2. Call Gemini REST API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "List the items in this receipt as a JSON array of objects with keys 'name' (string) and 'price' (number). Exclude tax/tip. Fix abbreviations." },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Clean
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json" 
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", JSON.stringify(data));
      return;
    }

    // 3. Parse Gemini Response
    // Gemini returns: candidates[0].content.parts[0].text
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) throw new Error("No text returned from Gemini");

    // Parse the string into JSON
    const parsed = JSON.parse(rawText);
    
    // Handle cases where Gemini wraps array in { items: [...] } or just [...]
    const items = Array.isArray(parsed) ? parsed : (parsed.items || []);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Critical Error:", error);
    return returnMockData();
  }
})