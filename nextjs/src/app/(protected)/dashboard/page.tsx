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
} from "lucide-react";
import type { TryOnResult, Profile } from "@/types";

interface DashboardData {
  profile: Profile | null;
  wardrobeCount: number;
  tryOnCount: number;
  favoritesCount: number;
  recentTryOns: TryOnResult[];
  hasModel: boolean;
}

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
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Hey, {data.profile?.full_name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your virtual wardrobe
        </p>
      </div>

      {/* Onboarding prompt */}
      {!data.hasModel && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 rounded-full bg-primary/10">
              <ScanFace className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Complete your setup</h3>
              <p className="text-sm text-muted-foreground">
                Create your AI model to start trying on outfits
              </p>
            </div>
            <Link href="/onboarding">
              <Button>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
              <Shirt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.wardrobeCount}</p>
              <p className="text-sm text-muted-foreground">Wardrobe Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-950">
              <Wand2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.tryOnCount}</p>
              <p className="text-sm text-muted-foreground">Try-Ons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-950">
              <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.favoritesCount}</p>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/wardrobe/upload">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="py-6 text-center">
              <Plus className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Upload Clothing</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add items to your wardrobe
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/try-on">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="py-6 text-center">
              <Wand2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Try On Outfits</p>
              <p className="text-sm text-muted-foreground mt-1">
                Mix and match your clothes
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/onboarding">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="py-6 text-center">
              <ScanFace className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Update Model</p>
              <p className="text-sm text-muted-foreground mt-1">
                Rescan your body model
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent try-ons */}
      {data.recentTryOns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Try-Ons</h2>
            <Link
              href="/try-on"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.recentTryOns.map((tryOn) => (
              <Link key={tryOn.id} href={`/try-on/${tryOn.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4]">
                    <img
                      src={tryOn.result_image_url}
                      alt="Try-on result"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
