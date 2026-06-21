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
  agent?: 'frontend' | 'backend' | 'fullstack' | 'general'
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";
  const model = "llama-3.3-70b-versatile";

  let systemPrompt = `You are Pixelcode Developer Assistant, a strict coding-only AI assistant. You only answer questions related to programming, software development, coding, databases, web technologies, DevOps, algorithms, computer science, and systems design.
If the user asks about ANYTHING else (including general knowledge, news, creative writing, history, lifestyle, sports, cooking, politics, etc.), you must strictly decline to answer and state: "I am a dedicated coding assistant and can only help with programming, coding, or system development questions." Do not answer the question under any circumstances if it is outside these topics.`;

  if (agent === "frontend") {
    systemPrompt = `You are Pixelcode Frontend Developer Assistant. You only answer questions related to frontend technologies, user interfaces, styling (CSS, Tailwind), responsive design, web performance, browser APIs, React, TypeScript, and HTML. If the user asks about anything else, decline politely. Provide expert frontend design and development recommendations and code snippets.`;
  } else if (agent === "backend") {
    systemPrompt = `You are Pixelcode Backend Developer Assistant. You only answer questions related to backend systems, database schemas, SQL and NoSQL databases, API design, DevOps pipelines, server security, authentication (JWT, OAuth), caching (Redis), and system optimization. If the user asks about anything else, decline politely. Provide expert backend design architecture recommendations and code.`;
  } else if (agent === "fullstack") {
    systemPrompt = `You are Pixelcode Fullstack Developer Assistant. You answer questions related to both frontend and backend development, database integration, devops, deployments (Vercel, AWS), authentication, and end-to-end web system architectures. Give clear recommendations on the data flow between components.`;
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  const url = isLocalhost ? "https://api.groq.com/openai/v1/chat/completions" : "/api/chat";
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  if (isLocalhost) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model,
      messages: apiMessages,
      stream: true,
      temperature: 0.2
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
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
