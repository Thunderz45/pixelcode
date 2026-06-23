export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const customApiKey = "d1e62ce306477b95876637b4c965858007c3c5569e136e1a4b000323d5577d51784650083c62b07933ab443371bd3edb";
  
  const response = await fetch("/api/generateImage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      customApiKey,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to generate image");
  }

  return data.image; // returns base64 image data url
}
