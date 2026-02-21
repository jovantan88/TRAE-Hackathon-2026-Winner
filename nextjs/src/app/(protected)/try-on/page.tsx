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
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useStreamingRequest } from "@/hooks/use-streaming-request";
import { motion, AnimatePresence } from "framer-motion";
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
      <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
        <Skeleton className="h-[600px] rounded-3xl" />
        <Skeleton className="h-[600px] rounded-3xl" />
      </div>
    );
  }

  if (!model) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto mt-12"
      >
        <Card className="border-dashed border-2 bg-background/50">
          <CardContent className="py-16 text-center">
            <div className="p-4 rounded-full bg-secondary mb-4 inline-block">
              <ScanFace className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Model Found</h3>
            <p className="text-muted-foreground mb-6">
              You need to create your digital twin first before trying on clothes.
            </p>
            <Link href="/onboarding">
              <Button size="lg" className="shadow-md">
                <ScanFace className="mr-2 h-4 w-4" />
                Create My Model
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Virtual Try-On</h1>
        <p className="text-lg text-muted-foreground">
          Mix and match items to see how they look on your digital twin.
        </p>
      </div>

      <AnimatePresence>
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
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left panel - Model and Result */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-lg bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/40 bg-secondary/20">
              <CardTitle className="text-lg flex items-center gap-2">
                {resultImage ? (
                  <><Sparkles className="h-5 w-5 text-primary" /> Your New Look</>
                ) : (
                  <><ScanFace className="h-5 w-5 text-primary" /> Your Digital Twin</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                {streaming.isStreaming ? (
                  <motion.div 
                    key="streaming"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="aspect-[3/4] flex flex-col items-center justify-center bg-secondary/30 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="relative z-10 mb-6"
                    >
                      <div className="p-4 rounded-full bg-background shadow-lg border border-border/50">
                        <Wand2 className="h-8 w-8 text-primary" />
                      </div>
                    </motion.div>
                    <p className="font-medium text-lg relative z-10">
                      {streaming.status || "Styling your outfit..."}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 relative z-10">
                      {streaming.totalSteps > 0
                        ? `Step ${streaming.step} of ${streaming.totalSteps}`
                        : "Applying AI magic..."}
                    </p>
                    {streaming.totalSteps > 0 && (
                      <div className="w-48 h-1.5 bg-secondary rounded-full mt-6 overflow-hidden relative z-10">
                        <motion.div 
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${(streaming.step / streaming.totalSteps) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </motion.div>
                ) : resultImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative"
                  >
                    <img
                      src={resultImage}
                      alt="Try-on result"
                      className="w-full object-cover aspect-[3/4]"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1 bg-background/90 backdrop-blur-md hover:bg-background"
                        onClick={handleFavorite}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Save Look
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 bg-background/90 backdrop-blur-md hover:bg-background"
                        asChild
                      >
                        <a href={resultImage} download>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="model"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <img
                      src={model.model_image_url}
                      alt="Your model"
                      className="w-full object-cover aspect-[3/4]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Button
            className="w-full h-14 text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            disabled={selectedItems.size === 0 || streaming.isStreaming}
            onClick={handleGenerate}
          >
            {streaming.isStreaming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Try-On ({selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""})
              </>
            )}
          </Button>
        </div>

        {/* Right panel - Clothing selector */}
        <div className="lg:col-span-7">
          <Card className="h-full border-border/50 shadow-sm bg-background/50 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Select Clothing</CardTitle>
                <div className="px-3 py-1 rounded-full bg-secondary text-sm font-medium">
                  {selectedItems.size}/6 selected
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-secondary mb-4">
                    <Shirt className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Your wardrobe is empty</h3>
                  <p className="text-muted-foreground mb-6 max-w-xs">
                    Add some clothing items to your wardrobe to start styling outfits.
                  </p>
                  <Link href="/wardrobe/upload">
                    <Button>Add Clothing</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <Tabs
                      value={activeCategory}
                      onValueChange={(v) =>
                        setActiveCategory(v as ClothingCategory | "all")
                      }
                    >
                      <TabsList className="h-11 bg-secondary/50 p-1">
                        {categories.map((cat) => (
                          <TabsTrigger
                            key={cat.value}
                            value={cat.value}
                            className="rounded-md px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                          >
                            {cat.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 flex-1 content-start">
                    <AnimatePresence mode="popLayout">
                      {filteredItems.map((item) => {
                        const isSelected = selectedItems.has(item.id);
                        return (
                          <motion.button
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-300 text-left ${
                              isSelected
                                ? "border-primary shadow-md shadow-primary/20"
                                : "border-transparent hover:border-primary/30 bg-secondary/20"
                            }`}
                          >
                            <div className="aspect-square relative overflow-hidden bg-secondary/30">
                              <img
                                src={
                                  item.segmented_image_url ||
                                  item.original_image_url
                                }
                                alt={item.name}
                                className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
                              />
                              <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-primary/10' : 'bg-black/0 group-hover:bg-black/5'}`} />
                              
                              {isSelected && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-sm"
                                >
                                  <Check className="h-4 w-4" />
                                </motion.div>
                              )}
                            </div>
                            <div className={`p-2.5 transition-colors ${isSelected ? 'bg-primary/5' : 'bg-background/50'}`}>
                              <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
