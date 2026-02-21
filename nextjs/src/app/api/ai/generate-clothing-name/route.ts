import { NextResponse } from "next/server";
import { generateClothingName } from "@/lib/gemini/generate-clothing-name";

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType, category } = await request.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Image data and mimeType are required" },
        { status: 400 }
      );
    }

    const name = await generateClothingName(imageBase64, mimeType, category);

    return NextResponse.json({ name });
  } catch (error) {
    console.error("Generate clothing name error:", error);
    return NextResponse.json(
      { error: "Failed to generate clothing name" },
      { status: 500 }
    );
  }
}
