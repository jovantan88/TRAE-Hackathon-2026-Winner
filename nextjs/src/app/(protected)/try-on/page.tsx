"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wand2,
  Loader2,
  ScanFace,
  Shirt,
  Check,
  Heart,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useStreamingRequest } from "@/hooks/use-streaming-request";
import type { UserModel, WardrobeItem, ClothingCategory } from "@/types";
import type { TryOnResult } from "@/types";

interface GenerateTryOnResponse {
  tryOnResult: TryOnResult;
}

const categories: { value: ClothingCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

export default function TryOnPage() {
  const [model, setModel] = useState<UserModel | null>(null);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<
    ClothingCategory | "all"
  >("all");
  const [loading, setLoading] = useState(true);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streaming = useStreamingRequest<GenerateTryOnResponse>();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    const [modelRes, itemsRes] = await Promise.all([
      supabase
        .from("user_models")
        .select("*")
        .eq("is_active", true)
        .single(),
      supabase
        .from("wardrobe_items")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (modelRes.data) setModel(modelRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function toggleItem(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 6) return prev;
        next.add(id);
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (!model || selectedItems.size === 0) return;

    setError(null);
    setResultImage(null);

    const result = await streaming.execute("/api/ai/try-on", {
      modelId: model.id,
      wardrobeItemIds: Array.from(selectedItems),
    });

    if (result?.tryOnResult) {
      setResultImage(result.tryOnResult.result_image_url);
      setResultId(result.tryOnResult.id);
    }
  }

  async function handleFavorite() {
    if (!resultId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("favorites").insert({
      user_id: user.id,
      try_on_id: resultId,
    });
  }

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category === activeCategory);
  const displayError = error || streaming.error;

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!model) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <ScanFace className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Model Found</h3>
          <p className="text-muted-foreground mb-4">
            You need to create your model first before trying on clothes
          </p>
          <Link href="/onboarding">
            <Button>
              <ScanFace className="mr-2 h-4 w-4" />
              Create My Model
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Virtual Try-On</h1>
        <p className="text-muted-foreground">
          Select clothing items and see how they look on you
        </p>
      </div>

      {displayError && (
        <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-md">
          {displayError}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left panel - Model and Result */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {resultImage ? "Try-On Result" : "Your Model"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {streaming.isStreaming ? (
                <div className="aspect-[3/4] flex flex-col items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="font-medium">
                    {streaming.status || "Generating your look..."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {streaming.totalSteps > 0
                      ? `Step ${streaming.step}/${streaming.totalSteps}`
                      : "This may take up to 30 seconds"}
                  </p>
                </div>
              ) : resultImage ? (
                <div className="space-y-3">
                  <img
                    src={resultImage}
                    alt="Try-on result"
                    className="w-full rounded-lg object-cover aspect-[3/4]"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleFavorite}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Favorite
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a href={resultImage} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <img
                  src={model.model_image_url}
                  alt="Your model"
                  className="w-full rounded-lg object-cover aspect-[3/4]"
                />
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={selectedItems.size === 0 || streaming.isStreaming}
            onClick={handleGenerate}
          >
            {streaming.isStreaming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {streaming.status || "Generating..."}
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate Try-On ({selectedItems.size} item
                {selectedItems.size !== 1 ? "s" : ""})
              </>
            )}
          </Button>
        </div>

        {/* Right panel - Clothing selector */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Clothing</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose up to 6 items ({selectedItems.size}/6 selected)
              </p>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <Shirt className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No items in your wardrobe yet
                  </p>
                  <Link href="/wardrobe/upload">
                    <Button size="sm">Add Clothing</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-4 overflow-x-auto">
                    <Tabs
                      value={activeCategory}
                      onValueChange={(v) =>
                        setActiveCategory(v as ClothingCategory | "all")
                      }
                    >
                      <TabsList className="h-8">
                        {categories.map((cat) => (
                          <TabsTrigger
                            key={cat.value}
                            value={cat.value}
                            className="text-xs px-2 py-1"
                          >
                            {cat.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
                    {filteredItems.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-muted-foreground/25"
                          }`}
                        >
                          <img
                            src={
                              item.segmented_image_url ||
                              item.original_image_url
                            }
                            alt={item.name}
                            className="w-full aspect-square object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          <div className="p-1">
                            <p className="text-xs truncate">{item.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
