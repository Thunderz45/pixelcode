export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const customApiKey = "d1e62ce306477b95876637b4c965858007c3c5569e136e1a4b000323d5577d51784650083c62b07933ab443371bd3edb";
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (isLocalhost) {
    const form = new FormData();
    form.append('prompt', prompt);

    const response = await fetch("https://clipdrop-api.co/text-to-image/v1", {
      method: "POST",
      headers: {
        "x-api-key": customApiKey
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clipdrop API returned error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    // Convert directly in browser
    const blob = new Blob([arrayBuffer], { type: 'image/png' });
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
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
}
