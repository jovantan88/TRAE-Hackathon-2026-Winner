"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Heart, Download, Wand2, Sparkles, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
  const [isSharing, setIsSharing] = useState(false);
  const [caption, setCaption] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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

  async function shareToFeed() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !data) return;

    setIsSharing(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        try_on_id: data.id,
        caption: caption.trim() || null,
      });

      if (error) throw error;

      toast.success("Shared to feed successfully!");
      setShareDialogOpen(false);
      setCaption("");
    } catch (error) {
      console.error("Error sharing to feed:", error);
      toast.error("Failed to share to feed.");
    } finally {
      setIsSharing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-6 w-32" />
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="aspect-[3/4] rounded-2xl" />
            <div className="flex gap-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center py-16"
      >
        <div className="p-4 rounded-full bg-secondary mb-4 inline-block">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Result Not Found</h3>
        <p className="text-muted-foreground mb-6">
          This try-on result may have been deleted or doesn't exist.
        </p>
        <Link href="/try-on">
          <Button size="lg" className="shadow-md">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Try-On
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pb-10"
    >
      <div className="mb-6">
        <Link
          href="/try-on"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Try-On
        </Link>
      </div>

      <Card className="border-border/50 shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-secondary/20 border-b border-border/40 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Look
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generated on{" "}
                {new Date(data.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-10 w-10 transition-all ${isFavorited ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-muted-foreground hover:text-primary'}`}
              onClick={toggleFavorite}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="relative rounded-2xl overflow-hidden bg-secondary/30 aspect-[3/4] ring-1 ring-border/50 shadow-inner">
            <img
              src={data.result_image_url}
              alt="Try-on result"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant={isFavorited ? "secondary" : "outline"}
              size="lg"
              className={`flex-1 h-12 text-base ${isFavorited ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' : ''}`}
              onClick={toggleFavorite}
            >
              <Heart
                className={`mr-2 h-5 w-5 ${isFavorited ? "fill-current" : ""}`}
              />
              {isFavorited ? "Saved to Favorites" : "Save Look"}
            </Button>
            <Button size="lg" className="flex-1 h-12 text-base shadow-md" asChild>
              <a href={data.result_image_url} download>
                <Download className="mr-2 h-5 w-5" />
                Download Image
              </a>
            </Button>
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="default" className="flex-1 h-12 text-base shadow-md bg-primary text-primary-foreground hover:bg-primary/90">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share to Feed
                </Button>
              </DialogTrigger>
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
                  <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-xl overflow-hidden">
                    <img src={data.result_image_url} alt="Preview" className="object-cover w-full h-full" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
                  <Button onClick={shareToFeed} disabled={isSharing}>
                    {isSharing ? "Sharing..." : "Share Post"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {data.items.length > 0 && (
            <div className="pt-6 border-t border-border/40">
              <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Clothing Used</h4>
              <div className="flex flex-wrap gap-2">
                {data.items.map((item) => (
                  <Badge key={item.id} variant="secondary" className="px-3 py-1 text-sm bg-secondary/50 hover:bg-secondary">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Link href="/try-on" className="block">
              <Button variant="outline" className="w-full h-12 text-base border-dashed border-2 hover:border-primary/50 hover:bg-primary/5">
                <Wand2 className="mr-2 h-5 w-5" />
                Try Another Combination
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
