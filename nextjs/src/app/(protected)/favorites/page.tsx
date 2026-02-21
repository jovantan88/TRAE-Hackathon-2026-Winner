"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Wand2, Trash2, Sparkles, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { TryOnResult, WardrobeItem } from "@/types";

interface FavoriteItem {
  id: string;
  created_at: string;
  try_on: TryOnResult;
  items: WardrobeItem[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [caption, setCaption] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTryOn, setSelectedTryOn] = useState<TryOnResult | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get favorites with try-on results
    const { data: favs } = await supabase
      .from("favorites")
      .select("id, created_at, try_on_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!favs?.length) {
      setLoading(false);
      return;
    }

    const tryOnIds = favs.map((f) => f.try_on_id);

    // Get try-on results
    const { data: tryOns } = await supabase
      .from("try_on_results")
      .select("*")
      .in("id", tryOnIds);

    // Get try-on items for all results
    const { data: tryOnItems } = await supabase
      .from("try_on_items")
      .select("try_on_id, wardrobe_item_id")
      .in("try_on_id", tryOnIds);

    // Get all wardrobe items referenced
    const itemIds = [
      ...new Set(tryOnItems?.map((ti) => ti.wardrobe_item_id) || []),
    ];
    const { data: wardrobeItems } = await supabase
      .from("wardrobe_items")
      .select("*")
      .in("id", itemIds);

    // Assemble data
    const assembled = favs.map((fav) => {
      const tryOn = tryOns?.find((t) => t.id === fav.try_on_id);
      const relatedItemIds =
        tryOnItems
          ?.filter((ti) => ti.try_on_id === fav.try_on_id)
          .map((ti) => ti.wardrobe_item_id) || [];
      const items =
        wardrobeItems?.filter((wi) => relatedItemIds.includes(wi.id)) || [];

      return {
        id: fav.id,
        created_at: fav.created_at,
        try_on: tryOn!,
        items,
      };
    });

    setFavorites(assembled.filter((f) => f.try_on));
    setLoading(false);
  }

  async function handleRemove(favoriteId: string) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId);

    if (!error) {
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    }
  }

  async function shareToFeed() {
    if (!selectedTryOn) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setIsSharing(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        try_on_id: selectedTryOn.id,
        caption: caption.trim() || null,
      });

      if (error) throw error;

      toast.success("Shared to feed successfully!");
      setShareDialogOpen(false);
      setCaption("");
      setSelectedTryOn(null);
    } catch (error) {
      console.error("Error sharing to feed:", error);
      toast.error("Failed to share to feed.");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary fill-primary/20" />
          Favorites
        </h1>
        <p className="text-lg text-muted-foreground">
          Your saved outfit combinations and AI-generated looks.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mt-12"
        >
          <Card className="border-dashed border-2 bg-background/50">
            <CardContent className="py-16 text-center">
              <div className="p-4 rounded-full bg-secondary mb-4 inline-block">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-6">
                Try on some outfits and save your favorite looks to build your collection.
              </p>
              <Link href="/try-on">
                <Button size="lg" className="shadow-md">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Try On Outfits
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {favorites.map((fav) => (
              <motion.div
                key={fav.id}
                variants={item}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="group overflow-hidden border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-background/50 backdrop-blur-sm h-full flex flex-col">
                  <Link href={`/try-on/${fav.try_on.id}`} className="block relative aspect-[3/4] overflow-hidden bg-secondary/30">
                    <img
                      src={fav.try_on.result_image_url}
                      alt="Favorite outfit"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(fav.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-md text-destructive opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground shadow-sm translate-y-2 group-hover:translate-y-0"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedTryOn(fav.try_on);
                        setShareDialogOpen(true);
                      }}
                      className="absolute top-3 right-14 p-2 rounded-full bg-background/80 backdrop-blur-md text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground shadow-sm translate-y-2 group-hover:translate-y-0"
                      aria-label="Share to feed"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </Link>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      {new Date(fav.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {fav.items.slice(0, 3).map((item) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 bg-secondary/50 hover:bg-secondary"
                        >
                          {item.name}
                        </Badge>
                      ))}
                      {fav.items.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-secondary/50">
                          +{fav.items.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share to Community Feed</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Input
                id="caption"
                placeholder="Write something about this outfit..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            {selectedTryOn && (
              <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-xl overflow-hidden">
                <img src={selectedTryOn.result_image_url} alt="Preview" className="object-cover w-full h-full" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={shareToFeed} disabled={isSharing}>
              {isSharing ? "Sharing..." : "Share Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
