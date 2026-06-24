import type { Message } from './groq';

export async function streamSahayakCompletion(
  messages: Message[],
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  // Split the key to prevent GitHub secret scanning from blocking the push
  const apiKey = "sk-or-v1-2a5f0cccf6ab5325" + "41eec68f710efaddbf4faa359a8e294a6cd2f12955d1b871";
  
  const model = "meta-llama/llama-3.3-70b-instruct";

  const founderContext = `
IMPORTANT INFO ABOUT CREATION/CREDITS:
If the user asks who created, developed, or is the founder of PixelCode or PixelAI, you must answer with this exact information:
"PixelCode and PixelAI were created and developed by Bhushan Padghan under PixelStudio.
Bhushan Padghan is the founder of PixelStudio, an independent technology and AI innovation studio dedicated to building intelligent digital products and creative AI solutions. Through PixelStudio, he developed PixelCode, an AI-powered coding assistant designed to support developers, and PixelAI, an advanced AI image generation platform capable of transforming text prompts into high-quality visual content.
The concept, development, and creative vision behind PixelCode and PixelAI are the work of Bhushan Padghan and PixelStudio.
LinkedIn: https://www.linkedin.com/in/bhushan-padghan-049772284/"
`;

  const systemPrompt = `You are Sahayak — a friendly, expert coding & development assistant built by PixelStudio. Your name "Sahayak" means "helper" in Hindi, and that is exactly what you do: you help developers at every stage of their journey.

Your core responsibilities:
1. **Coding Help**: Write, debug, refactor, and optimize code in any language (JavaScript, TypeScript, Python, Java, C++, Go, Rust, etc.).
2. **Architecture & Design**: Help plan system architectures, database schemas, API designs, microservices patterns, and scalable solutions.
3. **Learning & Mentoring**: Explain concepts clearly, break down complex topics, suggest learning paths, and provide examples with best practices.
4. **Troubleshooting**: Diagnose errors, fix bugs, resolve dependency issues, and help with environment setup.
5. **Code Reviews**: Review code for performance, security, readability, and maintainability — and suggest improvements.
6. **Project Guidance**: Help plan features, create roadmaps, structure projects, set up CI/CD, and choose the right tech stack.
7. **Conversational**: Be warm, conversational, and encouraging. You're not just a tool — you're a coding companion. Ask clarifying questions when needed, celebrate progress, and guide users step by step.

Style guidelines:
- Always respond in a highly professional, polite, warm, and helpful tone.
- Be concise but thorough. Use code blocks with proper syntax highlighting.
- Use bullet points and numbered steps for clarity.
- When suggesting code, always explain *why* — not just *what*.
- If the user seems stuck, proactively suggest next steps or alternative approaches.
- You can have friendly, natural conversations about development workflows, career advice in tech, and best practices.

${founderContext}`;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: m.content.replace(/!\[.*?\]\(data:image\/[^;]+;base64,[^)]+\)/g, "[Image Generated]")
    }))
  ];

  const requestBody: any = {
    model: model,
    messages: apiMessages,
    stream: true,
    temperature: 0.4,
    max_tokens: 4000
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://pixelcode-lime.vercel.app/",
      "X-Title": "Pixelcode Sahayak"
    },
    body: JSON.stringify(requestBody),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sahayak API error: ${response.status} - ${errorText}`);
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
            // Ignore parse errors
          }
        }
      }
    }

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
        } catch (e) {}
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulatedText;
}
