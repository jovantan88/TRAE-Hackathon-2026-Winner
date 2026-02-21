import { createClient } from "@/lib/supabase/server";
import { generateTryOn } from "@/lib/gemini/try-on";
import { createSSEStream } from "@/lib/stream";
import { NextResponse } from "next/server";

async function downloadAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  return {
    base64: buffer.toString("base64"),
    mimeType: blob.type || "image/png",
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { modelId, wardrobeItemIds } = await request.json();

  if (!modelId || !wardrobeItemIds?.length) {
    return NextResponse.json(
      { error: "modelId and wardrobeItemIds are required" },
      { status: 400 }
    );
  }

  const { send, close, response } = createSSEStream();

  void (async () => {
    try {
      send({
        type: "status",
        message: "Loading model and wardrobe items...",
        step: 1,
        totalSteps: 6,
      });

      const { data: model, error: modelError } = await supabase
        .from("user_models")
        .select("*")
        .eq("id", modelId)
        .eq("user_id", user.id)
        .single();

      if (modelError || !model) {
        throw new Error("Model not found");
      }

      const { data: items, error: itemsError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .in("id", wardrobeItemIds)
        .eq("user_id", user.id);

      if (itemsError || !items?.length) {
        throw new Error("Wardrobe items not found");
      }

      send({
        type: "status",
        message: "Preparing model and clothing images...",
        step: 2,
        totalSteps: 6,
      });

      const modelImage = await downloadAsBase64(model.model_image_url);
      const clothingImages = await Promise.all(
        items.map(async (item) => {
          const imageUrl = item.segmented_image_url || item.original_image_url;
          const downloaded = await downloadAsBase64(imageUrl);
          return {
            base64: downloaded.base64,
            mimeType: downloaded.mimeType,
            description: `${item.category}: ${item.name}`,
          };
        })
      );

      send({
        type: "status",
        message: "Generating try-on image with AI...",
        step: 3,
        totalSteps: 6,
      });

      const result = await generateTryOn(
        modelImage.base64,
        modelImage.mimeType,
        clothingImages
      );

      send({
        type: "status",
        message: "Uploading generated try-on image...",
        step: 4,
        totalSteps: 6,
      });

      const resultFileName = `${user.id}/${crypto.randomUUID()}.${result.mimeType.split("/")[1]}`;
      const resultBuffer = Buffer.from(result.imageBase64, "base64");

      const { error: uploadError } = await supabase.storage
        .from("try-on-results")
        .upload(resultFileName, resultBuffer, {
          contentType: result.mimeType,
        });

      if (uploadError) {
        throw new Error("Failed to upload result");
      }

      const {
        data: { publicUrl: resultUrl },
      } = supabase.storage.from("try-on-results").getPublicUrl(resultFileName);

      send({
        type: "status",
        message: "Saving try-on result...",
        step: 5,
        totalSteps: 6,
      });

      const { data: tryOnResult, error: insertError } = await supabase
        .from("try_on_results")
        .insert({
          user_id: user.id,
          model_id: modelId,
          result_image_url: resultUrl,
          prompt_used: `Try-on with items: ${items.map((i) => i.name).join(", ")}`,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error("Failed to save result");
      }

      send({
        type: "status",
        message: "Linking selected wardrobe items...",
        step: 6,
        totalSteps: 6,
      });

      const tryOnItems = wardrobeItemIds.map((itemId: string) => ({
        try_on_id: tryOnResult.id,
        wardrobe_item_id: itemId,
      }));

      await supabase.from("try_on_items").insert(tryOnItems);

      send({ type: "complete", data: { tryOnResult } });
    } catch (error) {
      console.error("Try-on error:", error);
      send({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate try-on image",
      });
    } finally {
      close();
    }
  })();

  return response;
}
