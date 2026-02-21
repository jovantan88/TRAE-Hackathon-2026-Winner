"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStreamingRequest } from "@/hooks/use-streaming-request";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScanFace, Upload, Check, RotateCcw, Loader2 } from "lucide-react";
import type { UserModel } from "@/types";

interface GenerateModelResponse {
  model: UserModel;
  imageDataUrl: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<"upload" | "generating" | "preview">(
    "upload"
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>("");
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const streaming = useStreamingRequest<GenerateModelResponse>();
  const router = useRouter();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setError(null);
    setUploadedMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  async function handleGenerate() {
    if (!uploadedImage) return;

    setStep("generating");
    setError(null);
    const base64 = uploadedImage.split(",")[1];

    const result = await streaming.execute("/api/ai/generate-model", {
      imageBase64: base64,
      mimeType: uploadedMimeType,
    });

    if (result) {
      setModelImage(result.imageDataUrl || result.model.model_image_url);
      setStep("preview");
      return;
    }

    setStep("upload");
  }

  function handleAccept() {
    router.push("/dashboard");
    router.refresh();
  }

  function handleRetry() {
    setStep("upload");
    setUploadedImage(null);
    setModelImage(null);
    setError(null);
    streaming.reset();
  }

  const displayError = error || streaming.error;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
          <ScanFace className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Create Your Model</h1>
        <p className="text-muted-foreground mt-2">
          Upload a full-body photo and we&apos;ll generate a model for virtual
          try-ons
        </p>
      </div>

      {displayError && (
        <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-md">
          {displayError}
        </div>
      )}

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Full Body Photo</CardTitle>
            <CardDescription>
              For best results, use a well-lit photo with your full body visible,
              wearing fitted clothing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFile(file);
                };
                input.click();
              }}
            >
              {uploadedImage ? (
                <div className="space-y-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded body photo"
                    className="max-h-96 mx-auto rounded-lg object-contain"
                  />
                  <p className="text-sm text-muted-foreground">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      Drag & drop your photo here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPEG, PNG or WebP up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            {uploadedImage && (
              <Button
                className="w-full mt-4"
                size="lg"
                onClick={handleGenerate}
                disabled={streaming.isStreaming}
              >
                <ScanFace className="mr-2 h-5 w-5" />
                Generate My Model
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === "generating" && (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Generating Your Model
            </h3>
            <p className="text-muted-foreground">
              {streaming.status ||
                "Our AI is creating a personalized model from your photo..."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {streaming.totalSteps > 0
                ? `Step ${streaming.step}/${streaming.totalSteps}`
                : "This may take up to 30 seconds"}
            </p>
          </CardContent>
        </Card>
      )}

      {step === "preview" && modelImage && (
        <Card>
          <CardHeader>
            <CardTitle>Your AI Model</CardTitle>
            <CardDescription>
              This model will be used for all your virtual try-ons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Original Photo
                </p>
                <img
                  src={uploadedImage!}
                  alt="Original"
                  className="w-full rounded-lg object-cover aspect-[3/4]"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Generated Model
                </p>
                <img
                  src={modelImage}
                  alt="Generated model"
                  className="w-full rounded-lg object-cover aspect-[3/4]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetry}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button className="flex-1" onClick={handleAccept}>
                <Check className="mr-2 h-4 w-4" />
                Accept & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
