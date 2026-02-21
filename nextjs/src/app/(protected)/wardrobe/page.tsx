"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Shirt, Trash2 } from "lucide-react";
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Wardrobe</h1>
          <p className="text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} in your
            collection
          </p>
        </div>
        <Link href="/wardrobe/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <div className="mb-6 overflow-x-auto">
        <Tabs
          value={activeCategory}
          onValueChange={(v) =>
            setActiveCategory(v as ClothingCategory | "all")
          }
        >
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Shirt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {activeCategory === "all"
                ? "Your wardrobe is empty"
                : `No ${activeCategory} yet`}
            </h3>
            <p className="text-muted-foreground mb-4">
              Start by uploading photos of your clothing items
            </p>
            <Link href="/wardrobe/upload">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Item
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square">
                <img
                  src={item.segmented_image_url || item.original_image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {item.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
