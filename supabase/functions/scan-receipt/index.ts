import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image } = await req.json() // Expecting Base64 string from frontend

    if (!image) throw new Error('No image provided');

    // Remove header if present (e.g. "data:image/jpeg;base64,") to get raw base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // 1. Prepare Request for Mindee
    // We create a FormData object to send the file
    const formData = new FormData();
    
    // We convert base64 back to a Blob for Mindee
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    formData.append('document', blob, 'receipt.jpg');

    console.log(`Token ${Deno.env.get('MINDEE_API_KEY')}`)
    
    // 2. Call Mindee API (Expense Receipts v5)
    const response = await fetch('https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${Deno.env.get('MINDEE_API_KEY')}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mindee Error:", JSON.stringify(data));
      throw new Error('Mindee API failed');
    }

    // 3. Parse Mindee Response to Cheq Format
    // Mindee returns deeply nested objects. We want "line_items".
    const prediction = data.document?.inference?.prediction;
    const lineItems = prediction?.line_items || [];

    // Map to { name, price }
    const formattedItems = lineItems.map((item: any) => ({
      name: item.description || "Unknown Item",
      price: item.total_amount || 0
    }));

    // Filter out 0 price items or low confidence junk
    const cleanItems = formattedItems.filter((i: any) => i.price > 0 && i.name.length > 2);

    return new Response(JSON.stringify({ items: cleanItems }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})