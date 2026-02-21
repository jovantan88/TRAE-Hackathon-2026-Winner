"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Share2, Globe, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Post, Profile, TryOnResult, WardrobeItem } from "@/types";

interface FeedPost extends Post {
  user: Profile;
  try_on: TryOnResult;
  items: WardrobeItem[];
  likes_count: number;
  is_liked_by_me: boolean;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // For a hackathon demo, we'll fetch all posts. In a real app, you'd filter by friends.
    // Fetch posts
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        user:profiles(*),
        try_on:try_on_results(*)
      `)
      .order("created_at", { ascending: false });

    if (!postsData?.length) {
      setLoading(false);
      return;
    }

    // Fetch likes
    const postIds = postsData.map((p) => p.id);
    const { data: likesData } = await supabase
      .from("post_likes")
      .select("*")
      .in("post_id", postIds);

    // Fetch items for these try-ons
    const tryOnIds = postsData.map((p) => p.try_on_id);
    const { data: tryOnItems } = await supabase
      .from("try_on_items")
      .select("try_on_id, wardrobe_item_id")
      .in("try_on_id", tryOnIds);

    const itemIds = [...new Set(tryOnItems?.map((ti) => ti.wardrobe_item_id) || [])];
    const { data: wardrobeItems } = await supabase
      .from("wardrobe_items")
      .select("*")
      .in("id", itemIds);

    const assembled: FeedPost[] = postsData.map((post) => {
      const postLikes = likesData?.filter((l) => l.post_id === post.id) || [];
      const isLikedByMe = postLikes.some((l) => l.user_id === user.id);
      
      const relatedItemIds = tryOnItems
        ?.filter((ti) => ti.try_on_id === post.try_on_id)
        .map((ti) => ti.wardrobe_item_id) || [];
      const items = wardrobeItems?.filter((wi) => relatedItemIds.includes(wi.id)) || [];

      return {
        ...post,
        likes_count: postLikes.length,
        is_liked_by_me: isLikedByMe,
        items,
      };
    });

    setPosts(assembled);
    setLoading(false);
  }

  async function toggleLike(postId: string, isCurrentlyLiked: boolean) {
    if (!currentUserId) return;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            is_liked_by_me: !isCurrentlyLiked,
            likes_count: isCurrentlyLiked ? p.likes_count - 1 : p.likes_count + 1,
          };
        }
        return p;
      })
    );

    if (isCurrentlyLiked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: currentUserId,
      });
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto pb-10 space-y-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-8 w-8 text-primary" />
          Community Feed
        </h1>
        <p className="text-lg text-muted-foreground">
          See what your friends are wearing and get inspired.
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="aspect-[3/4] rounded-2xl" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="p-4 rounded-full bg-secondary mb-4 inline-block">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground mb-6">
            Be the first to share an outfit with the community!
          </p>
          <Link href="/try-on">
            <Button size="lg" className="shadow-md">
              Create an Outfit
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-8">
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="block"
              >
                <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-background/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center gap-3 pb-4">
                    <Link href={`/profile/${post.user_id}`}>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden">
                        {post.user?.avatar_url ? (
                          <img src={post.user.avatar_url} alt={post.user.full_name || "User"} className="w-full h-full object-cover" />
                        ) : (
                          (post.user?.full_name?.[0] || "U").toUpperCase()
                        )}
                      </div>
                    </Link>
                    <div className="flex flex-col">
                      <Link href={`/profile/${post.user_id}`} className="font-semibold hover:underline">
                        {post.user?.full_name || "Anonymous User"}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4] bg-secondary/30">
                      <img
                        src={post.try_on?.result_image_url}
                        alt="Outfit"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleLike(post.id, post.is_liked_by_me)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.is_liked_by_me ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Heart className={`h-6 w-6 ${post.is_liked_by_me ? "fill-current" : ""}`} />
                          <span className="font-medium">{post.likes_count}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                          <MessageCircle className="h-6 w-6" />
                        </button>
                        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors ml-auto">
                          <Share2 className="h-5 w-5" />
                        </button>
                      </div>

                      {post.caption && (
                        <p className="text-sm">
                          <span className="font-semibold mr-2">{post.user?.full_name || "User"}</span>
                          {post.caption}
                        </p>
                      )}

                      {post.items && post.items.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Tagged Items</p>
                          <div className="flex flex-wrap gap-1.5">
                            {post.items.map((item) => (
                              <Badge key={item.id} variant="secondary" className="bg-secondary/50 hover:bg-secondary text-xs">
                                {item.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}