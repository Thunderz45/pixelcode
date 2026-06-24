export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}
export async function streamGroqCompletion(
  messages: Message[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  agent?: 'fullstack' | 'uiux' | 'designtocode' | 'sahayak' | 'general',
  modelType?: 'pro' | 'high' | 'low'
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";

  let model = "meta-llama/llama-3.3-70b-instruct";
  if (modelType === "high") {
    model = "mistralai/mixtral-8x7b-instruct";
  } else if (modelType === "low") {
    model = "google/gemma-2-9b-it";
  }
  const founderContext = `
IMPORTANT INFO ABOUT CREATION/CREDITS:
If the user asks who created, developed, or is the founder of PixelCode or PixelAI, you must answer with this exact information:
"PixelCode and PixelAI were created and developed by Bhushan Padghan under PixelStudio.
Bhushan Padghan is the founder of PixelStudio, an independent technology and AI innovation studio dedicated to building intelligent digital products and creative AI solutions. Through PixelStudio, he developed PixelCode, an AI-powered coding assistant designed to support developers, and PixelAI, an advanced AI image generation platform capable of transforming text prompts into high-quality visual content.
The concept, development, and creative vision behind PixelCode and PixelAI are the work of Bhushan Padghan and PixelStudio.
LinkedIn: https://www.linkedin.com/in/bhushan-padghan-049772284/"
`;

  let systemPrompt = `You are Pixelcode Developer Assistant, a strict coding-only AI assistant. You only answer questions related to programming, software development, coding, databases, web technologies, DevOps, algorithms, computer science, and systems design.
If the user asks about ANYTHING else (including general knowledge, news, creative writing, history, lifestyle, sports, cooking, politics, etc.), you must strictly decline to answer and state: "I am a dedicated coding assistant and can only help with programming, coding, or system development questions." Do not answer the question under any circumstances if it is outside these topics.
${founderContext}`;

  if (agent === "fullstack") {
    systemPrompt = `You are Pixelcode Fullstack Developer Assistant. You answer questions related to both frontend and backend development, database integration, devops, deployments (Vercel, AWS), authentication, and end-to-end web system architectures. Give clear recommendations on the data flow between components.
${founderContext}`;
  } else if (agent === "uiux") {
    systemPrompt = `You are Pixelcode UI/UX Designer Assistant. Your primary task is to refine user prompts for UI designs. You conceptualize beautiful, modern user interfaces, suggest color palettes, typography, and layouts, and help structure the visual hierarchy of web applications. Output a concise but highly detailed and descriptive text prompt that can be directly used by an image generation API. Focus on the visual elements.
${founderContext}`;
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ 
      role: m.role, 
      content: m.content.replace(/!\[.*?\]\(data:image\/[^;]+;base64,[^)]+\)/g, "[Image Generated]") 
    }))
  ];

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  const url = isLocalhost ? "https://openrouter.ai/api/v1/chat/completions" : "/api/chat";
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  if (isLocalhost) {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["HTTP-Referer"] = "https://pixelcode-lime.vercel.app/";
    headers["X-Title"] = "Pixelcode";
  }

  const requestBody: any = {
    model: model,
    messages: apiMessages,
    stream: true,
    temperature: 0.2,
    max_tokens: 2000
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder("utf-8");
  let accumulatedText = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split("\n");
      // Keep the last partial line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === "data: [DONE]") continue;

        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices[0]?.delta?.content || "";
            if (delta) {
              accumulatedText += delta;
              onChunk(delta);
            }
          } catch (e) {
            // Ignore parse errors if lines get split awkwardly
          }
        }
      }
    }

    // Flush any remaining buffer text if it forms a complete line
    if (buffer) {
      const trimmed = buffer.trim();
      if (trimmed && trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
        try {
          const data = JSON.parse(trimmed.slice(6));
          const delta = data.choices[0]?.delta?.content || "";
          if (delta) {
            accumulatedText += delta;
            onChunk(delta);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulatedText;
}
