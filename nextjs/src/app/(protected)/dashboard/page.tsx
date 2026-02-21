"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shirt,
  Wand2,
  Heart,
  ScanFace,
  Plus,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import type { TryOnResult, Profile } from "@/types";

interface DashboardData {
  profile: Profile | null;
  wardrobeCount: number;
  tryOnCount: number;
  favoritesCount: number;
  recentTryOns: TryOnResult[];
  hasModel: boolean;
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
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
} as const;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, wardrobeRes, tryOnRes, favRes, modelRes, recentRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("wardrobe_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("try_on_results")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("favorites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("user_models")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single(),
        supabase
          .from("try_on_results")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

    setData({
      profile: profileRes.data,
      wardrobeCount: wardrobeRes.count || 0,
      tryOnCount: tryOnRes.count || 0,
      favoritesCount: favRes.count || 0,
      recentTryOns: recentRes.data || [],
      hasModel: !!modelRes.data,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10 pb-10"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {data.profile?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-lg text-muted-foreground">
          Here's what's happening in your virtual wardrobe today.
        </p>
      </motion.div>

      {/* Onboarding prompt */}
      {!data.hasModel && (
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6 py-8 relative z-10">
              <div className="p-4 rounded-2xl bg-background shadow-sm border border-border/50">
                <ScanFace className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">Complete your digital twin</h3>
                <p className="text-muted-foreground">
                  Create your AI model to start trying on outfits and seeing how clothes fit your body.
                </p>
              </div>
              <Link href="/onboarding" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
                  Create Model
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="flex items-center gap-5 py-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Shirt className="h-7 w-7" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{data.wardrobeCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Wardrobe Items</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="flex items-center gap-5 py-6">
            <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Wand2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{data.tryOnCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Try-Ons Generated</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="flex items-center gap-5 py-6">
            <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Heart className="h-7 w-7" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{data.favoritesCount}</p>
              <p className="text-sm font-medium text-muted-foreground">Saved Looks</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item}>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/wardrobe/upload" className="group">
            <Card className="h-full border-border/50 bg-background/50 hover:bg-secondary/20 hover:border-primary/30 transition-all duration-300">
              <CardContent className="py-8 flex flex-col items-center text-center">
                <div className="p-4 rounded-full bg-secondary mb-4 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Add Clothing</h3>
                <p className="text-sm text-muted-foreground">
                  Digitize new items for your wardrobe
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/try-on" className="group">
            <Card className="h-full border-border/50 bg-background/50 hover:bg-secondary/20 hover:border-primary/30 transition-all duration-300">
              <CardContent className="py-8 flex flex-col items-center text-center">
                <div className="p-4 rounded-full bg-secondary mb-4 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Style an Outfit</h3>
                <p className="text-sm text-muted-foreground">
                  Mix and match items on your model
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/onboarding" className="group">
            <Card className="h-full border-border/50 bg-background/50 hover:bg-secondary/20 hover:border-primary/30 transition-all duration-300">
              <CardContent className="py-8 flex flex-col items-center text-center">
                <div className="p-4 rounded-full bg-secondary mb-4 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                  <ScanFace className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Update Model</h3>
                <p className="text-sm text-muted-foreground">
                  Create a new digital twin
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>

      {/* Recent try-ons */}
      {data.recentTryOns.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Looks</h2>
            <Link
              href="/try-on"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.recentTryOns.map((tryOn, i) => (
              <motion.div 
                key={tryOn.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/try-on/${tryOn.id}`}>
                  <Card className="overflow-hidden group cursor-pointer border-border/50 hover:border-primary/50 transition-all duration-300">
                    <div className="aspect-[3/4] relative overflow-hidden bg-secondary/50">
                      <img
                        src={tryOn.result_image_url}
                        alt="Try-on result"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
