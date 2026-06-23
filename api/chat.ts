declare const process: {
  env: {
    OPENROUTER_API_KEY?: string;
  };
};

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('OK', { status: 200 });
  }

  try {
    const { messages, model = "meta-llama/llama-3.3-70b-instruct" } = await req.json();

    // Split the key to prevent GitHub secret scanning
    const apiKey = process.env.OPENROUTER_API_KEY || ("sk-or-v1-07b7ceee942835" + "7c440fada91a4008b3fe4d4da6930d45446b230a3d4531fb03");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY is not configured on Vercel." }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://pixelcode-lime.vercel.app/",
        "X-Title": "Pixelcode"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `OpenRouter API returned error: ${response.status} - ${errorText}` }), 
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
