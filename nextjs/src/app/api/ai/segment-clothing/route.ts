import { createClient } from "@/lib/supabase/server";
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

  const { imageBase64, mimeType, name, category } = await request.json();

  if (!imageBase64 || !mimeType || !name || !category) {
    return NextResponse.json(
      { error: "Image data, mimeType, name, and category are required" },
      { status: 400 }
    );
  }

  const { send, close, response } = createSSEStream();

  void (async () => {
    try {
      send({
        type: "status",
        message: "Uploading original clothing photo...",
        step: 1,
        totalSteps: 4,
      });

      const originalFileName = `${user.id}/${crypto.randomUUID()}.${mimeType.split("/")[1]}`;
      const originalBuffer = Buffer.from(imageBase64, "base64");

      const { error: uploadError } = await supabase.storage
        .from("wardrobe-originals")
        .upload(originalFileName, originalBuffer, {
          contentType: mimeType,
        });

      if (uploadError) {
        throw new Error("Failed to upload image");
      }

      const {
        data: { publicUrl: originalUrl },
      } = supabase.storage
        .from("wardrobe-originals")
        .getPublicUrl(originalFileName);

      send({
        type: "status",
        message: "Extracting clothing item with AI...",
        step: 2,
        totalSteps: 4,
      });

      const result = await segmentClothing(imageBase64, mimeType, category);

      send({
        type: "status",
        message: "Uploading processed clothing image...",
        step: 3,
        totalSteps: 4,
      });

      const segmentedFileName = `${user.id}/${crypto.randomUUID()}.${result.mimeType.split("/")[1]}`;
      const segmentedBuffer = Buffer.from(result.imageBase64, "base64");

      const { error: segUploadError } = await supabase.storage
        .from("wardrobe-segmented")
        .upload(segmentedFileName, segmentedBuffer, {
          contentType: result.mimeType,
        });

      if (segUploadError) {
        throw new Error("Failed to upload segmented image");
      }

      const {
        data: { publicUrl: segmentedUrl },
      } = supabase.storage
        .from("wardrobe-segmented")
        .getPublicUrl(segmentedFileName);

      send({
        type: "status",
        message: "Saving wardrobe item...",
        step: 4,
        totalSteps: 4,
      });

      const { data: item, error: insertError } = await supabase
        .from("wardrobe_items")
        .insert({
          user_id: user.id,
          name,
          category,
          original_image_url: originalUrl,
          segmented_image_url: segmentedUrl,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error("Failed to save wardrobe item");
      }

      send({ type: "complete", data: { item } });
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
