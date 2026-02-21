"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shirt, Wand2, Heart, ScanFace, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Chatbot } from "@/components/chatbot/chatbot";
import { useState } from "react";

export function LandingClient() {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      {/* Header */}
      <header className="fixed top-0 w-full border-b border-border/40 bg-background/80 backdrop-blur-md z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <Shirt className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">COCO</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-sm font-medium hover:bg-secondary/50"
              onClick={() => setChatbotOpen(true)}
            >
              Try AI Advisor
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium hover:bg-secondary/50">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="text-sm font-medium shadow-sm hover:shadow-md transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_40%)] opacity-[0.03] dark:opacity-[0.05]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--color-primary)_0%,transparent_40%)] opacity-[0.03] dark:opacity-[0.05]" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium text-muted-foreground mb-8"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>The future of personal styling</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]"
              >
                Your wardrobe, <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  reimagined by AI.
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
              >
                Upload your photo, digitize your clothes, and instantly see how any outfit looks on you. Stop guessing, start styling.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                className="flex flex-col sm:flex-row items-center gap-4 mt-10"
              >
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all group">
                    Start for free
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base font-medium bg-background/50 backdrop-blur-sm hover:bg-secondary/50 transition-all">
                    Sign In
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-secondary/30 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg">Four simple steps to your perfect digital wardrobe.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: ScanFace,
                  title: "1. Create your model",
                  desc: "Upload a full-body photo. Our AI creates a precise digital twin of you.",
                  color: "text-blue-500",
                  bg: "bg-blue-500/10"
                },
                {
                  icon: Shirt,
                  title: "2. Digitize clothes",
                  desc: "Snap photos of your garments. We automatically extract and categorize them.",
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10"
                },
                {
                  icon: Wand2,
                  title: "3. Virtual try-on",
                  desc: "Mix and match items to see exactly how they look on your body.",
                  color: "text-violet-500",
                  bg: "bg-violet-500/10"
                },
                {
                  icon: Heart,
                  title: "4. Save & organize",
                  desc: "Curate your favorite looks and plan your outfits for any occasion.",
                  color: "text-rose-500",
                  bg: "bg-rose-500/10"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-background rounded-3xl shadow-sm border border-border/50 transition-all duration-300 group-hover:shadow-md group-hover:border-border" />
                  <div className="relative p-8">
                    <div className={`inline-flex p-3 rounded-2xl ${feature.bg} mb-6 transition-transform duration-300 group-hover:scale-110`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Ready to upgrade your style?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of users who have already transformed how they dress every day.
            </p>
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 text-lg font-medium shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                Create your free account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shirt className="h-5 w-5" />
            <span className="font-medium">COCO</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} COCO. All rights reserved.
          </p>
        </div>
      </footer>

      <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
}
