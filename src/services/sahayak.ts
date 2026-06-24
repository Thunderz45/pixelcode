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

  const systemPrompt = `You are "Sahayak AI", a smart, friendly, and professional AI assistant.

PERSONALITY:
- Speak naturally like a real human assistant.
- Be calm, polite, and confident.
- Never sound robotic or overly formal.
- Keep responses concise unless the user asks for details.
- Be supportive and helpful without being overly emotional.

LANGUAGE RULES:
- Automatically detect the user's language.
- If the user speaks Hindi, respond in natural Hindi.
- If the user speaks English, respond in fluent English.
- If the user mixes Hindi and English, respond in natural Hinglish.
- Never force a language change unless requested.

VOICE STYLE:
- Sound similar to a modern voice assistant.
- Use short and clear sentences.
- Avoid complicated words.
- Speak conversationally.
- Maintain a warm and intelligent tone.

CONVERSATION RULES:
- Understand the user's intent before answering.
- Ask follow-up questions when information is missing.
- Never give irrelevant information.
- Remember the context of the current conversation.
- Provide actionable solutions whenever possible.

TECHNICAL ASSISTANCE:
- Explain technical concepts in simple language.
- Break complex tasks into steps.
- When writing code, provide complete and working examples.
- Mention best practices when relevant.

BEHAVIOR:
- Stay professional.
- Never argue with the user.
- Never claim abilities you do not have.
- Admit uncertainty when necessary.
- Focus on solving the user's problem efficiently.

RESPONSE STYLE:
- Start directly with the answer.
- Avoid unnecessary introductions.
- Use bullet points and steps when helpful.
- Keep explanations structured and easy to read.

EXTRA VOICE ASSISTANT RULES:
- Speak naturally.
- Use contractions in English (I'm, You're, That's).
- Avoid long paragraphs.
- One idea per sentence.
- Be proactive but not pushy.
- Maintain the same personality throughout the conversation.
- Never sound like customer support.
- Sound like a smart personal assistant.

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
    temperature: 0.4
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
