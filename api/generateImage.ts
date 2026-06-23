import { Buffer } from "node:buffer";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('OK', { status: 200 });
  }

  try {
    const { prompt, customApiKey } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required." }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = customApiKey;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API Key is not configured." }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const form = new FormData();
    form.append('prompt', prompt);

    const response = await fetch("https://clipdrop-api.co/text-to-image/v1", {
      method: "POST",
      headers: {
        "x-api-key": apiKey
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Clipdrop API returned error: ${response.status} - ${errorText}` }), 
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clipdrop returns the image as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert ArrayBuffer to Base64 in Edge runtime securely
    const base64String = Buffer.from(arrayBuffer).toString('base64');

    return new Response(
      JSON.stringify({ 
        success: true, 
        image: `data:image/png;base64,${base64String}` 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
