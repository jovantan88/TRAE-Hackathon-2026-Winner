import { type Part } from "@google/genai";
import { generateImage } from "./client";

function getSegmentationPrompt(category: string): string {
  return `Extract the ${category} clothing item from this image. Generate a clean product-style image of ONLY the clothing item on a pure white background.

Requirements:
- Remove the person completely, remove any background
- Show the clothing item in a flat-lay style, as if laid out on a white surface for a product catalog
- Preserve ALL details, patterns, colors, textures, and labels of the garment
- The clothing should be neatly arranged and well-lit
- No wrinkles or distortion
- The image should look like a professional e-commerce product photo
- Only the ${category} item should be visible, nothing else`;
}

export async function segmentClothing(
  imageBase64: string,
  mimeType: string,
  category: string
): Promise<{ imageBase64: string; mimeType: string; text?: string }> {
  const parts: Part[] = [
    { text: getSegmentationPrompt(category) },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ];

  const result = await generateImage(parts);

  if (!result.imageBase64 || !result.mimeType) {
    throw new Error("Failed to segment clothing - no image in response");
  }

  return {
    imageBase64: result.imageBase64,
    mimeType: result.mimeType,
    text: result.text,
  };
}
