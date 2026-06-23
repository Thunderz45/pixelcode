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

    // Clipdrop returns the image as an ArrayBuffer or binary stream
    // Instead of converting it to Base64 in Edge, we just pass the stream back to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
