import { createClient } from "@/lib/supabase/server";
import { generateClothingName } from "@/lib/gemini/generate-clothing-name";
import { segmentClothing } from "@/lib/gemini/segment-clothing";
import { createSSEStream } from "@/lib/stream";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageBase64, mimeType, category } = await request.json();

  if (!imageBase64 || !mimeType || !category) {
    return NextResponse.json(
      { error: "Image data, mimeType, and category are required" },
      { status: 400 }
    );
  }

  const { send, close, response } = createSSEStream();

  void (async () => {
    try {
      send({
        type: "status",
        message: "Extracting clothing item with AI...",
        step: 1,
        totalSteps: 3,
      });

      const result = await segmentClothing(imageBase64, mimeType, category);

      send({
        type: "status",
        message: "Generating item name from extracted image...",
        step: 2,
        totalSteps: 3,
      });

      const suggestedName = await generateClothingName(
        result.imageBase64,
        result.mimeType,
        category
      );

      send({
        type: "status",
        message: "Ready to review. Save or delete this draft.",
        step: 3,
        totalSteps: 3,
      });

      send({
        type: "complete",
        data: {
          draft: {
            suggestedName,
            segmentedImageBase64: result.imageBase64,
            segmentedMimeType: result.mimeType,
          },
        },
      });
    } catch (error) {
      console.error("Segment clothing error:", error);
      send({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to process clothing image",
      });
    } finally {
      close();
    }
  })();

  return response;
}
