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
import { ScanFace, Upload, Check, RotateCcw, Loader2, Sparkles, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pb-10"
    >
      <div className="text-center mb-10">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex p-4 rounded-full bg-primary/10 mb-6 shadow-inner"
        >
          <ScanFace className="h-10 w-10 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Create Your Digital Twin</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Upload a full-body photo and our AI will generate a personalized model for virtual try-ons.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {displayError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl"
          >
            {displayError}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="border-border/50 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-secondary/20 border-b border-border/40 pb-6">
                <CardTitle className="text-xl">Upload Photo</CardTitle>
                <CardDescription className="text-base">
                  For best results, use a well-lit photo with your full body visible, wearing fitted clothing.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-border hover:border-primary/50 hover:bg-secondary/20"
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
                  {isDragging && (
                    <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm z-10 flex items-center justify-center">
                      <Upload className="h-12 w-12 text-primary animate-bounce" />
                    </div>
                  )}
                  
                  {uploadedImage ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="relative inline-block">
                        <img
                          src={uploadedImage}
                          alt="Uploaded body photo"
                          className="max-h-96 mx-auto rounded-xl object-contain shadow-md"
                        />
                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Click or drag to replace image
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-6 py-8">
                      <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium mb-2">
                          Drag & drop your photo here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse files
                        </p>
                        <p className="text-xs text-muted-foreground mt-4">
                          Supports JPEG, PNG or WebP up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <AnimatePresence>
                  {uploadedImage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    >
                      <Button
                        className="w-full h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerate();
                        }}
                        disabled={streaming.isStreaming}
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate My Digital Twin
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-border/50 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <CardContent className="py-24 text-center relative z-10">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-8"
                >
                  <div className="p-4 rounded-full bg-background shadow-lg border border-border/50">
                    <Wand2 className="h-10 w-10 text-primary" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold mb-3">
                  Creating Your Digital Twin
                </h3>
                <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                  {streaming.status ||
                    "Our AI is analyzing your photo and generating a personalized 3D model..."}
                </p>
                
                <div className="max-w-xs mx-auto mt-8">
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Progress</span>
                    <span>
                      {streaming.totalSteps > 0
                        ? `${Math.round((streaming.step / streaming.totalSteps) * 100)}%`
                        : "Starting..."}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ 
                        width: streaming.totalSteps > 0 
                          ? `${(streaming.step / streaming.totalSteps) * 100}%` 
                          : "5%" 
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    This usually takes about 15-30 seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "preview" && modelImage && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border/50 shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-secondary/20 border-b border-border/40 pb-6 text-center">
                <div className="inline-flex items-center justify-center p-2 bg-green-500/10 text-green-500 rounded-full mb-4 mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">Model Generated Successfully!</CardTitle>
                <CardDescription className="text-base">
                  Here is your new digital twin ready for virtual try-ons.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">
                        Original Photo
                      </p>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden bg-secondary/30 aspect-[3/4] ring-1 ring-border/50">
                      <img
                        src={uploadedImage!}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        Digital Twin
                      </p>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden bg-secondary/30 aspect-[3/4] ring-2 ring-primary/50 shadow-lg shadow-primary/10">
                      <img
                        src={modelImage}
                        alt="Generated model"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-14 text-base"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Try Another Photo
                  </Button>
                  <Button 
                    size="lg" 
                    className="flex-1 h-14 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                    onClick={handleAccept}
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Looks Good, Let's Go!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
