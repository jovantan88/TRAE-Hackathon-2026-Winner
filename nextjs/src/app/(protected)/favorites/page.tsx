"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Wand2, Trash2 } from "lucide-react";
import type { TryOnResult, WardrobeItem } from "@/types";

interface FavoriteItem {
  id: string;
  created_at: string;
  try_on: TryOnResult;
  items: WardrobeItem[];
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Favorites</h1>
        <p className="text-muted-foreground">
          Your saved outfit combinations
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-4">
              Try on some outfits and save your favorites
            </p>
            <Link href="/try-on">
              <Button>
                <Wand2 className="mr-2 h-4 w-4" />
                Try On Outfits
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <Card
              key={fav.id}
              className="group overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={`/try-on/${fav.try_on.id}`}>
                <div className="relative aspect-[3/4]">
                  <img
                    src={fav.try_on.result_image_url}
                    alt="Favorite outfit"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(fav.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Link>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(fav.created_at).toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </p>
                <div className="flex flex-wrap gap-1">
                  {fav.items.slice(0, 3).map((item) => (
                    <Badge
                      key={item.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {item.name}
                    </Badge>
                  ))}
                  {fav.items.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{fav.items.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
