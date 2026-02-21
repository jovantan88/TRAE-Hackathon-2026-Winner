import { createClient } from "@/lib/supabase/server";
import { generateModelImage } from "@/lib/gemini/generate-model";
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

  const { imageBase64, mimeType } = await request.json();

  if (!imageBase64 || !mimeType) {
    return NextResponse.json(
      { error: "Image data and mimeType are required" },
      { status: 400 }
    );
  }

  const { send, close, response } = createSSEStream();

  void (async () => {
    try {
      send({
        type: "status",
        message: "Uploading original photo...",
        step: 1,
        totalSteps: 5,
      });

      const originalFileName = `${user.id}/${crypto.randomUUID()}.${mimeType.split("/")[1]}`;
      const originalBuffer = Buffer.from(imageBase64, "base64");

      const { error: uploadError } = await supabase.storage
        .from("body-photos")
        .upload(originalFileName, originalBuffer, {
          contentType: mimeType,
        });

      if (uploadError) {
        throw new Error("Failed to upload original photo");
      }

      const {
        data: { publicUrl: originalUrl },
      } = supabase.storage.from("body-photos").getPublicUrl(originalFileName);

      send({
        type: "status",
        message: "Generating AI model image...",
        step: 2,
        totalSteps: 5,
      });

      const result = await generateModelImage(imageBase64, mimeType);

      send({
        type: "status",
        message: "Uploading generated model...",
        step: 3,
        totalSteps: 5,
      });

      const modelFileName = `${user.id}/${crypto.randomUUID()}.${result.mimeType.split("/")[1]}`;
      const modelBuffer = Buffer.from(result.imageBase64, "base64");

      const { error: modelUploadError } = await supabase.storage
        .from("model-images")
        .upload(modelFileName, modelBuffer, {
          contentType: result.mimeType,
        });

      if (modelUploadError) {
        throw new Error("Failed to upload model image");
      }

      const {
        data: { publicUrl: modelUrl },
      } = supabase.storage.from("model-images").getPublicUrl(modelFileName);

      send({
        type: "status",
        message: "Saving model profile...",
        step: 4,
        totalSteps: 5,
      });

      await supabase
        .from("user_models")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("is_active", true);

      const { data: modelRecord, error: insertError } = await supabase
        .from("user_models")
        .insert({
          user_id: user.id,
          original_photo_url: originalUrl,
          model_image_url: modelUrl,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error("Failed to save model record");
      }

      send({
        type: "status",
        message: "Finalizing onboarding...",
        step: 5,
        totalSteps: 5,
      });

      await supabase
        .from("profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", user.id);

      send({
        type: "complete",
        data: {
          model: modelRecord,
          imageDataUrl: `data:${result.mimeType};base64,${result.imageBase64}`,
        },
      });
    } catch (error) {
      console.error("Generate model error:", error);
      send({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate model image",
      });
    } finally {
      close();
    }
  })();

  return response;
}
