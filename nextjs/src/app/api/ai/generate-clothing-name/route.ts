import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Image data and mimeType are required" },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // or gemini-flash-latest if supported by the SDK, but let's use gemini-2.5-flash or gemini-1.5-flash-latest
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze this clothing item and generate a short, specific, and descriptive name for it (e.g., 'Vintage Blue Denim Jacket', 'Black Nike Running Shorts', 'Red Floral Summer Dress'). Return ONLY the name, nothing else." },
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

    const name = response.text?.trim() || "New Clothing Item";

    return NextResponse.json({ name });
  } catch (error) {
    console.error("Generate clothing name error:", error);
    return NextResponse.json(
      { error: "Failed to generate clothing name" },
      { status: 500 }
    );
  }
}
