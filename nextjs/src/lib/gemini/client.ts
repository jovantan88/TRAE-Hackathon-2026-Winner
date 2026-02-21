import { GoogleGenAI, type Part } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const IMAGE_MODEL = "gemini-2.5-flash-image";
export const TEXT_MODEL = "gemini-3-flash-preview";

interface GeminiImageResult {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}

export async function generateImage(
  parts: Part[],
): Promise<GeminiImageResult> {
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts ?? [];

  let text: string | undefined;
  let imageBase64: string | undefined;
  let mimeType: string | undefined;

  for (const part of responseParts) {
    if (part.text) text = part.text;
    if (part.inlineData) {
      imageBase64 = part.inlineData.data;
      mimeType = part.inlineData.mimeType;
    }
  }

  return { text, imageBase64, mimeType };
}

export async function generateText(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
  });

  return response.text ?? "";
}
