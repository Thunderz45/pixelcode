export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function streamGroqCompletion(
  messages: Message[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";
  const model = "llama-3.3-70b-versatile";

  const SYSTEM_PROMPT = `You are Pixelcode Developer Assistant, a strict coding-only AI assistant. You only answer questions related to programming, software development, coding, databases, web technologies, DevOps, algorithms, computer science, and systems design.
If the user asks about ANYTHING else (including general knowledge, news, creative writing, history, lifestyle, sports, cooking, politics, etc.), you must strictly decline to answer and state: "I am a dedicated coding assistant and can only help with programming, coding, or system development questions." Do not answer the question under any circumstances if it is outside these topics.`;

  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
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
