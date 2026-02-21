"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Check, X, Search } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Profile } from "@/types";

interface FriendRequest {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: "pending" | "accepted" | "rejected";
  other_user: Profile;
  is_incoming: boolean;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  function getFriendsErrorMessage(error: { code?: string; message?: string } | null): string {
    if (!error) return "Something went wrong.";
    if (error.code === "42P01") {
      return "Social tables are not installed yet. Run supabase-bootstrap-social.sql in Supabase SQL Editor.";
    }
    return error.message || "Something went wrong.";
  }

  useEffect(() => {
    loadFriends();
  }, []);

  async function loadFriends() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get all friendships where user is involved
    const { data: friendships, error } = await supabase
      .from("friends")
      .select("*")
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

    if (error) {
      toast.error(getFriendsErrorMessage(error));
      setLoading(false);
      return;
    }

    if (!friendships?.length) {
      setLoading(false);
      return;
    }

    // Get profiles for the other users
    const otherUserIds = friendships.map((f) =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", otherUserIds);

    const assembled: FriendRequest[] = friendships.map((f) => {
      const isIncoming = f.user_id_2 === user.id;
      const otherUserId = isIncoming ? f.user_id_1 : f.user_id_2;
      const otherUser = profiles?.find((p) => p.id === otherUserId)!;

      return {
        ...f,
        other_user: otherUser,
        is_incoming: isIncoming,
      };
    });

    setFriends(assembled);
    setLoading(false);
  }

  async function searchUsers(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || !currentUserId) return;

    setSearching(true);
    const query = searchQuery.trim();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq("id", currentUserId)
      .limit(10);

    if (error) {
      toast.error("Failed to search users");
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const existingConnectionIds = new Set(
      friends.map((friend) =>
        friend.user_id_1 === currentUserId ? friend.user_id_2 : friend.user_id_1
      )
    );

    const filteredResults = (data || []).filter((profile) => !existingConnectionIds.has(profile.id));
    setSearchResults(filteredResults);
    setSearching(false);
  }

  async function sendRequest(userId: string) {
    if (!currentUserId) return;

    const { data: existingFriendship, error: existingError } = await supabase
      .from("friends")
      .select("id, status, user_id_1, user_id_2")
      .or(
        `and(user_id_1.eq.${currentUserId},user_id_2.eq.${userId}),and(user_id_1.eq.${userId},user_id_2.eq.${currentUserId})`
      )
      .maybeSingle();

    if (existingError) {
      toast.error(getFriendsErrorMessage(existingError));
      return;
    }

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        toast.info("You are already friends");
        return;
      }

      if (existingFriendship.status === "pending" && existingFriendship.user_id_1 === userId) {
        const { error: acceptError } = await supabase
          .from("friends")
          .update({ status: "accepted" })
          .eq("id", existingFriendship.id);

        if (acceptError) {
          toast.error("Failed to accept friend request");
          return;
        }

        toast.success("Friend request accepted!");
        loadFriends();
        setSearchResults((prev) => prev.filter((p) => p.id !== userId));
        return;
      }

      toast.info("Friend request already pending");
      return;
    }

    const { error } = await supabase.from("friends").insert({
      user_id_1: currentUserId,
      user_id_2: userId,
      status: "pending",
    });

    if (error) {
      console.error("Friend request error:", error);
      toast.error(getFriendsErrorMessage(error));
    } else {
      toast.success("Friend request sent!");
      loadFriends();
      setSearchResults((prev) => prev.filter((p) => p.id !== userId));
    }
  }

  async function respondToRequest(requestId: string, status: "accepted" | "rejected") {
    const { error } = await supabase
      .from("friends")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast.error(getFriendsErrorMessage(error));
    } else {
      toast.success(`Request ${status}`);
      loadFriends();
    }
  }

  const pendingIncoming = friends.filter((f) => f.status === "pending" && f.is_incoming);
  const pendingOutgoing = friends.filter((f) => f.status === "pending" && !f.is_incoming);
  const acceptedFriends = friends.filter((f) => f.status === "accepted");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto pb-10 space-y-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Friends
        </h1>
        <p className="text-lg text-muted-foreground">
          Connect with others and share your style.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Friend Requests */}
          {pendingIncoming.length > 0 && (
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Friend Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingIncoming.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden">
                        {req.other_user?.avatar_url ? (
                          <img src={req.other_user.avatar_url} alt={req.other_user.full_name || "User"} className="w-full h-full object-cover" />
                        ) : (
                          (req.other_user?.full_name?.[0] || "U").toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{req.other_user?.full_name || "Anonymous User"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => respondToRequest(req.id, "accepted")}>
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => respondToRequest(req.id, "rejected")}>
                        <X className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* My Friends */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                My Friends ({acceptedFriends.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : acceptedFriends.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  You haven't added any friends yet. Search for people to connect with!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {acceptedFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden">
                        {friend.other_user?.avatar_url ? (
                          <img src={friend.other_user.avatar_url} alt={friend.other_user.full_name || "User"} className="w-full h-full object-cover" />
                        ) : (
                          (friend.other_user?.full_name?.[0] || "U").toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{friend.other_user?.full_name || "Anonymous User"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search Users */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Find Friends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={searchUsers} className="flex gap-2">
                <Input
                  placeholder="Search by email or full name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" disabled={searching || !searchQuery.trim()}>
                  Search
                </Button>
              </form>

              <div className="space-y-3 mt-4">
                {searchResults.map((user) => {
                  const isFriend = friends.some((f) => f.other_user.id === user.id);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden text-xs">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name || "User"} className="w-full h-full object-cover" />
                          ) : (
                            (user.full_name?.[0] || "U").toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.full_name || "Anonymous User"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {!isFriend && (
                        <Button size="sm" variant="ghost" onClick={() => sendRequest(user.id)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-sm text-muted-foreground text-center py-4">No users found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}