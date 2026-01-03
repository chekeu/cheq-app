import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Client, product } from "https://esm.sh/mindee@4.3.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image } = await req.json()
    
    const apiKey = Deno.env.get('MINDEE_API_KEY');
    if (!apiKey) throw new Error('Missing MINDEE_API_KEY');

    // 1. Initialize Client
    const mindeeClient = new Client({ apiKey: apiKey });

    // 2. Process Image (Base64 -> Buffer)
    const base64Clean = image.includes(',') ? image.split(',')[1] : image;
    const binaryStr = atob(base64Clean);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }

    // 3. Send to Mindee
    const inputSource = mindeeClient.docFromBuffer(bytes, "receipt.jpg");
    
    // Using ReceiptV5 product
    const response = await mindeeClient.parse(
      product.ReceiptV5,
      inputSource
    );

    // 4. Extract Data
    const prediction = response.document.inference.prediction;
    const lineItems = prediction.lineItems || [];

    const cleanItems = lineItems.map((item: any) => ({
      name: item.description || "Item",
      price: item.totalAmount || 0
    })).filter((i: any) => i.price > 0);

    return new Response(JSON.stringify({ items: cleanItems }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("SDK Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Scan failed" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})