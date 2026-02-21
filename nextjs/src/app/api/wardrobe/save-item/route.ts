import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    name,
    category,
    originalImageBase64,
    originalMimeType,
    segmentedImageBase64,
    segmentedMimeType,
  } = await request.json();

  if (
    !name ||
    !category ||
    !originalImageBase64 ||
    !originalMimeType ||
    !segmentedImageBase64 ||
    !segmentedMimeType
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const originalFileName = `${user.id}/${crypto.randomUUID()}.${originalMimeType.split("/")[1]}`;
    const originalBuffer = Buffer.from(originalImageBase64, "base64");

    const { error: uploadOriginalError } = await supabase.storage
      .from("wardrobe-originals")
      .upload(originalFileName, originalBuffer, {
        contentType: originalMimeType,
      });

    if (uploadOriginalError) {
      throw new Error("Failed to upload original image");
    }

    const {
      data: { publicUrl: originalUrl },
    } = supabase.storage.from("wardrobe-originals").getPublicUrl(originalFileName);

    const segmentedFileName = `${user.id}/${crypto.randomUUID()}.${segmentedMimeType.split("/")[1]}`;
    const segmentedBuffer = Buffer.from(segmentedImageBase64, "base64");

    const { error: uploadSegmentedError } = await supabase.storage
      .from("wardrobe-segmented")
      .upload(segmentedFileName, segmentedBuffer, {
        contentType: segmentedMimeType,
      });

    if (uploadSegmentedError) {
      throw new Error("Failed to upload segmented image");
    }

    const {
      data: { publicUrl: segmentedUrl },
    } = supabase.storage.from("wardrobe-segmented").getPublicUrl(segmentedFileName);

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

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Save wardrobe item error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save wardrobe item" },
      { status: 500 }
    );
  }
}
