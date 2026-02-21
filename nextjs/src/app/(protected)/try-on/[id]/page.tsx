"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart, Download, Wand2 } from "lucide-react";
import type { TryOnResult, WardrobeItem } from "@/types";

interface TryOnDetail extends TryOnResult {
  items: WardrobeItem[];
  is_favorited: boolean;
}

export default function TryOnDetailPage() {
  const params = useParams();
  const [data, setData] = useState<TryOnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get try-on result
    const { data: result } = await supabase
      .from("try_on_results")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!result) {
      setLoading(false);
      return;
    }

    // Get associated items
    const { data: tryOnItems } = await supabase
      .from("try_on_items")
      .select("wardrobe_item_id")
      .eq("try_on_id", params.id);

    const itemIds = tryOnItems?.map((ti) => ti.wardrobe_item_id) || [];
    const { data: wardrobeItems } = await supabase
      .from("wardrobe_items")
      .select("*")
      .in("id", itemIds);

    // Check if favorited
    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("try_on_id", params.id)
      .eq("user_id", user.id)
      .single();

    setData({
      ...result,
      items: wardrobeItems || [],
      is_favorited: !!fav,
    });
    setIsFavorited(!!fav);
    setLoading(false);
  }

  async function toggleFavorite() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !data) return;

    if (isFavorited) {
      await supabase
        .from("favorites")
        .delete()
        .eq("try_on_id", data.id)
        .eq("user_id", user.id);
      setIsFavorited(false);
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        try_on_id: data.id,
      });
      setIsFavorited(true);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="aspect-[3/4]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Try-on result not found</p>
        <Link href="/try-on">
          <Button variant="outline" className="mt-4">
            Back to Try-On
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/try-on"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Try-On
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Try-On Result</CardTitle>
          <p className="text-sm text-muted-foreground">
            Generated on{" "}
            {new Date(data.created_at).toLocaleDateString("en-US", {
              dateStyle: "medium",
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <img
            src={data.result_image_url}
            alt="Try-on result"
            className="w-full rounded-lg object-cover aspect-[3/4]"
          />

          <div className="flex gap-2">
            <Button
              variant={isFavorited ? "default" : "outline"}
              className="flex-1"
              onClick={toggleFavorite}
            >
              <Heart
                className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current" : ""}`}
              />
              {isFavorited ? "Favorited" : "Add to Favorites"}
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a href={data.result_image_url} download>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          </div>

          {data.items.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Clothing Used</h4>
              <div className="flex flex-wrap gap-2">
                {data.items.map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Link href="/try-on">
            <Button variant="outline" className="w-full">
              <Wand2 className="mr-2 h-4 w-4" />
              Try Another Look
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
