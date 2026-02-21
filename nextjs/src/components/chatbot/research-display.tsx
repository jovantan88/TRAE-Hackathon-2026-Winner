"use client";

import { motion } from "framer-motion";
import type { ResearchData } from "@/types/chatbot";
import { CheckCircle2, Lightbulb, Globe, Info } from "lucide-react";

interface ResearchDisplayProps {
  research: ResearchData;
  className?: string;
}

export function ResearchDisplay({ research, className = "" }: ResearchDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`space-y-4 ${className}`}
      role="region"
      aria-label="Clothing research and recommendations"
    >
      {research.climateInfo && (
        <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Climate Overview</h4>
          </div>
          <p className="text-sm text-muted-foreground">{research.climateInfo}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h4 className="text-sm font-semibold">Recommended Clothing</h4>
          </div>
          <ul className="space-y-2">
            {research.recommendedClothing.slice(0, 6).map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-emerald-500 mt-0.5">•</span>
                <span className="text-foreground/80">{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-semibold">Packing Tips</h4>
          </div>
          <ul className="space-y-2">
            {research.packingTips.slice(0, 5).map((tip, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-amber-500 mt-0.5">•</span>
                <span className="text-foreground/80">{tip}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {research.culturalNotes && (
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Cultural Notes</h4>
          </div>
          <p className="text-sm text-muted-foreground">{research.culturalNotes}</p>
        </div>
      )}
    </motion.div>
  );
}
