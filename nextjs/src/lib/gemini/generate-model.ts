import { type Part } from "@google/genai";
import { generateImage } from "./client";

const MODEL_GENERATION_PROMPT = `You are a professional fashion photography AI. Given this full-body photo of a person, generate a clean, well-lit, neutral-pose model image of the SAME person.

Requirements:
- The person should be standing straight, facing forward, in a natural relaxed pose
- They should be wearing simple fitted neutral clothing (plain white t-shirt and dark fitted pants)
- The background should be a pure white/light gray studio backdrop
- Preserve the person's EXACT face, body type, skin tone, hair color, and hair style
- The lighting should be even, professional studio lighting
- This image will be used as a base model for virtual clothing try-on
- Make it look like a professional fashion model photo
- Full body must be visible from head to toe`;

export async function generateModelImage(
  imageBase64: string,
  mimeType: string
): Promise<{ imageBase64: string; mimeType: string; text?: string }> {
  const parts: Part[] = [
    { text: MODEL_GENERATION_PROMPT },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ];

  const result = await generateImage(parts);

  if (!result.imageBase64 || !result.mimeType) {
    throw new Error("Failed to generate model image - no image in response");
  }

  return {
    imageBase64: result.imageBase64,
    mimeType: result.mimeType,
    text: result.text,
  };
}
