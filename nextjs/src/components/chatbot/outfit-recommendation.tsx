"use client";

import { motion } from "framer-motion";
import type { OutfitRecommendation } from "@/types/chatbot";
import { Shirt, Sparkles } from "lucide-react";
import Image from "next/image";

interface OutfitRecommendationDisplayProps {
  recommendation: OutfitRecommendation;
  className?: string;
}

export function OutfitRecommendationDisplay({
  recommendation,
  className = "",
}: OutfitRecommendationDisplayProps) {
  if (!recommendation.items || recommendation.items.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20 ${className}`}
      role="region"
      aria-label="Outfit recommendation from your wardrobe"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">From Your Wardrobe</h4>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{recommendation.summary}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recommendation.items.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/30"
          >
            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-secondary shrink-0">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Shirt className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
              <p className="text-xs text-primary/80 line-clamp-1">{item.reason}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
