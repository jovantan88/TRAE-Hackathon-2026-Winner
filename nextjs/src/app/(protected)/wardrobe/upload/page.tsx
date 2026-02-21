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
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useStreamingRequest } from "@/hooks/use-streaming-request";
import type { ClothingCategory, WardrobeItem } from "@/types";

interface SegmentClothingResponse {
  item: WardrobeItem;
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
  const [category, setCategory] = useState<ClothingCategory>("tops");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const streaming = useStreamingRequest<SegmentClothingResponse>();
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
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imagePreview || !name) return;

    setError(null);

    const base64 = imagePreview.split(",")[1];
    const result = await streaming.execute("/api/ai/segment-clothing", {
      imageBase64: base64,
      mimeType: imageMimeType,
      name,
      category,
    });

    if (result) {
      router.push("/wardrobe");
      router.refresh();
    }
  }

  const displayError = error || streaming.error;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/wardrobe"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Wardrobe
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Clothing Item</CardTitle>
          <CardDescription>
            Upload a photo of your clothing and we&apos;ll extract it for your
            digital wardrobe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {displayError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-md">
                {displayError}
              </div>
            )}

            {streaming.isStreaming && (
              <div className="p-3 text-sm text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 rounded-md">
                <p>{streaming.status || "Processing clothing image..."}</p>
                {streaming.totalSteps > 0 && (
                  <p className="mt-1 opacity-80">
                    Step {streaming.step}/{streaming.totalSteps}
                  </p>
                )}
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
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
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Clothing preview"
                    className="max-h-64 mx-auto rounded-lg object-contain"
                  />
                  <p className="text-sm text-muted-foreground">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      Drag & drop your clothing photo
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPEG, PNG or WebP up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                placeholder="e.g., Blue Denim Jacket"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ClothingCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={streaming.isStreaming || !imagePreview || !name}
            >
              {streaming.isStreaming ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {streaming.status || "Processing..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload & Process
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
