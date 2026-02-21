import { type Part } from "@google/genai";
import { generateImage } from "./client";

function getTryOnPrompt(itemDescriptions: string[]): string {
  return `You are a virtual fashion try-on system. The FIRST image is the person/model. The REMAINING images are clothing items to dress them in.

Generate a photorealistic image of this EXACT same person wearing ALL of the provided clothing items.

Clothing items to apply: ${itemDescriptions.join(", ")}

Requirements:
- Preserve the person's face, body type, skin tone, hair EXACTLY as in the first image
- The clothing should fit naturally on the person's body with proper draping and shadows
- Proper fabric physics - the clothes should look natural, not pasted on
- Keep the same neutral white/light gray studio background
- The person should be standing in a natural, relaxed pose
- Make it look like a real fashion photograph, not a digital collage
- Full body must be visible from head to toe
- The lighting should be consistent across the person and clothing`;
}

interface ClothingImage {
  base64: string;
  mimeType: string;
  description: string;
}

export async function generateTryOn(
  modelImageBase64: string,
  modelMimeType: string,
  clothingImages: ClothingImage[]
): Promise<{ imageBase64: string; mimeType: string; text?: string }> {
  const itemDescriptions = clothingImages.map((img) => img.description);

  const parts: Part[] = [
    { text: getTryOnPrompt(itemDescriptions) },
    {
      inlineData: {
        mimeType: modelMimeType,
        data: modelImageBase64,
      },
    },
    ...clothingImages.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    })),
  ];

  const result = await generateImage(parts);

  if (!result.imageBase64 || !result.mimeType) {
    throw new Error("Failed to generate try-on image - no image in response");
  }

  return {
    imageBase64: result.imageBase64,
    mimeType: result.mimeType,
    text: result.text,
  };
}
