"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Shirt, Trash2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WardrobeItem, ClothingCategory } from "@/types";

const categories: { value: ClothingCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
  { value: "activewear", label: "Activewear" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemAnim = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
} as const;

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<
    ClothingCategory | "all"
  >("all");
  const supabase = createClient();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const { data, error } = await supabase
      .from("wardrobe_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("wardrobe_items")
      .delete()
      .eq("id", id);

    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Wardrobe</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""} in your collection
          </p>
        </div>
        <Link href="/wardrobe/upload">
          <Button className="shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <Tabs
          value={activeCategory}
          onValueChange={(v) =>
            setActiveCategory(v as ClothingCategory | "all")
          }
          className="w-full"
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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-1/3 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mt-12"
        >
          <Card className="border-dashed border-2 bg-background/50">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-secondary mb-4">
                <Shirt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {activeCategory === "all"
                  ? "Your wardrobe is empty"
                  : `No ${activeCategory} yet`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Start building your digital wardrobe by uploading photos of your clothing items.
              </p>
              <Link href="/wardrobe/upload">
                <Button size="lg" className="shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Item
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                variants={itemAnim}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              >
                <Card className="group overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 bg-background/50 backdrop-blur-sm h-full flex flex-col">
                  <div className="relative aspect-[4/5] bg-secondary/30 overflow-hidden">
                    <img
                      src={item.segmented_image_url || item.original_image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(item.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-md text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground shadow-sm translate-y-2 group-hover:translate-y-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between gap-2">
                    <p className="font-medium text-sm line-clamp-2 leading-snug">{item.name}</p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 bg-secondary/80">
                        {item.category}
                      </Badge>
                      {item.color && (
                        <div 
                          className="w-4 h-4 rounded-full border border-border/50 shadow-sm" 
                          style={{ backgroundColor: item.color }}
                          title={item.color}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
