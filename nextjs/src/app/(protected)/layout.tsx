import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ChatbotProvider } from "@/components/chatbot/chatbot-provider";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      <Sidebar />
      <div className="md:pl-64 min-h-screen flex flex-col">
        <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <MobileNav />
      <ChatbotProvider />
    </div>
  );
}
