import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shirt, Wand2, Heart, ScanFace } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shirt className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">StyleAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4">
        <section className="py-20 md:py-32 text-center">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-6">
            <Wand2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            Your AI-Powered{" "}
            <span className="text-primary">Virtual Wardrobe</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
            Upload your photo, add your clothes, and see how any outfit looks on
            you &mdash; all powered by AI. Never wonder &ldquo;what should I
            wear?&rdquo; again.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-t">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-blue-100 dark:bg-blue-950 mb-4">
                <ScanFace className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Scan Yourself</h3>
              <p className="text-muted-foreground text-sm">
                Upload a full-body photo and our AI creates a personalized model
                of you
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-green-100 dark:bg-green-950 mb-4">
                <Shirt className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                2. Build Your Wardrobe
              </h3>
              <p className="text-muted-foreground text-sm">
                Upload photos of your clothes and we&apos;ll extract and catalog
                each item
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-purple-100 dark:bg-purple-950 mb-4">
                <Wand2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Try On Outfits</h3>
              <p className="text-muted-foreground text-sm">
                Mix and match clothes from your wardrobe and see them on your
                model instantly
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-pink-100 dark:bg-pink-950 mb-4">
                <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">4. Save Favorites</h3>
              <p className="text-muted-foreground text-sm">
                Save your best outfit combinations and come back to them
                anytime
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to try it?</h2>
          <p className="text-muted-foreground mb-8">
            Join now and start building your digital wardrobe in minutes
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Create Free Account
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>StyleAI &mdash; Built with Next.js, Supabase &amp; Gemini AI</p>
      </footer>
    </div>
  );
}
