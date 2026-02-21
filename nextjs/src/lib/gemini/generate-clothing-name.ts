import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function toSingularCategory(category?: string): string {
  if (!category) return "clothing item";

  const map: Record<string, string> = {
    tops: "top",
    bottoms: "bottom",
    dresses: "dress",
    outerwear: "outerwear",
    shoes: "shoe",
    accessories: "accessory",
    activewear: "activewear item",
    other: "clothing item",
  };

  return map[category] ?? category;
}

export async function generateClothingName(
  imageBase64: string,
  mimeType: string,
  category?: string
): Promise<string> {
  const categoryHint = toSingularCategory(category);

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze this extracted clothing product photo and generate one short, specific name.
Category hint: ${categoryHint}.
Use details like color, style, and garment type when visible.
Return only the name text and nothing else.`,
          },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
  });

  return response.text?.trim() || "New Clothing Item";
}
