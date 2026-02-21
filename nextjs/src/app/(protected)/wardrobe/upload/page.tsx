"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, ArrowLeft, Sparkles, Shirt, Trash2 } from "lucide-react";
import Link from "next/link";
import { useStreamingRequest } from "@/hooks/use-streaming-request";
import { motion, AnimatePresence } from "framer-motion";
import type { ClothingCategory } from "@/types";

interface SegmentClothingResponse {
  draft: {
    suggestedName: string;
    segmentedImageBase64: string;
    segmentedMimeType: string;
  };
}

const categories: { value: ClothingCategory; label: string }[] = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
  { value: "activewear", label: "Activewear" },
  { value: "other", label: "Other" },
];

export default function UploadClothingPage() {
  const [name, setName] = useState("");
  const [segmentedPreview, setSegmentedPreview] = useState<string | null>(null);
  const [segmentedBase64, setSegmentedBase64] = useState<string | null>(null);
  const [segmentedMimeType, setSegmentedMimeType] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [category, setCategory] = useState<ClothingCategory>("tops");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const streaming = useStreamingRequest<SegmentClothingResponse>();
  const router = useRouter();

  const resetDraft = useCallback(() => {
    setName("");
    setSegmentedPreview(null);
    setSegmentedBase64(null);
    setSegmentedMimeType("");
    streaming.reset();
  }, [streaming.reset]);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be under 10MB");
        return;
      }

      setError(null);
      resetDraft();
      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [resetDraft]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!imagePreview) return;

    setError(null);

    const base64 = imagePreview.split(",")[1];
    const result = await streaming.execute("/api/ai/segment-clothing", {
      imageBase64: base64,
      mimeType: imageMimeType,
      category,
    });

    if (result?.draft) {
      setName(result.draft.suggestedName);
      setSegmentedBase64(result.draft.segmentedImageBase64);
      setSegmentedMimeType(result.draft.segmentedMimeType);
      setSegmentedPreview(
        `data:${result.draft.segmentedMimeType};base64,${result.draft.segmentedImageBase64}`
      );
    }
  }

  async function handleSave() {
    if (!imagePreview || !imageMimeType || !name || !segmentedBase64 || !segmentedMimeType) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/wardrobe/save-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          originalImageBase64: imagePreview.split(",")[1],
          originalMimeType: imageMimeType,
          segmentedImageBase64: segmentedBase64,
          segmentedMimeType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save wardrobe item");
      }

      router.push("/wardrobe");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save wardrobe item");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    resetDraft();
    setImagePreview(null);
    setImageMimeType("");
    setError(null);
  }

  const displayError = error || streaming.error;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pb-10"
    >
      <div className="mb-6">
        <Link
          href="/wardrobe"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Wardrobe
        </Link>
      </div>

      <Card className="border-border/50 shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-secondary/20 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Shirt className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Add Clothing Item</CardTitle>
              <CardDescription className="text-base mt-1">
                Upload a photo of your clothing and our AI will extract it for your digital wardrobe.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-8">
            <AnimatePresence mode="wait">
              {displayError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl"
                >
                  {displayError}
                </motion.div>
              )}

              {streaming.isStreaming && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3"
                >
                  <Loader2 className="h-5 w-5 animate-spin shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{streaming.status || "Processing clothing image..."}</p>
                    {streaming.totalSteps > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1.5 opacity-80">
                          <span>Progress</span>
                          <span>{Math.round((streaming.step / streaming.totalSteps) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${(streaming.step / streaming.totalSteps) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {segmentedPreview && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Original</Label>
                  <img
                    src={imagePreview ?? ""}
                    alt="Original clothing"
                    className="w-full max-h-64 rounded-xl object-contain border border-border/50 bg-secondary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Extracted</Label>
                  <img
                    src={segmentedPreview}
                    alt="Extracted clothing"
                    className="w-full max-h-64 rounded-xl object-contain border border-border/50 bg-secondary/20"
                  />
                </div>
              </div>
            )}

            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
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

              {imagePreview ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Clothing preview"
                      className="max-h-64 mx-auto rounded-xl object-contain shadow-md"
                    />
                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Click or drag to replace image
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-6 py-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium mb-1">
                      Drag & drop your clothing photo
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

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-base">Item Name</Label>
                <Input
                  id="name"
                  placeholder={segmentedPreview ? "AI suggested name (editable)" : "Generated after extraction"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={!segmentedPreview || isSaving}
                  className="h-12 text-base bg-secondary/30 border-border/50 focus:bg-background"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-base">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ClothingCategory)}
                  disabled={streaming.isStreaming || isSaving}
                >
                  <SelectTrigger className="h-12 text-base bg-secondary/30 border-border/50 focus:bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-base py-2">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!segmentedPreview ? (
              <Button
                type="submit"
                className="w-full h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all mt-4"
                disabled={streaming.isStreaming || !imagePreview}
              >
                {streaming.isStreaming ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {streaming.status || "Processing..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Extracted Item
                  </>
                )}
              </Button>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="h-12"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Draft
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="h-12"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Save Item
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
