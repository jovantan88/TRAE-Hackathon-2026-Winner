"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MapPin, Calendar, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WeatherBadge } from "./weather-badge";
import { ResearchDisplay } from "./research-display";
import { OutfitRecommendationDisplay } from "./outfit-recommendation";
import type { ChatMessage, WeatherData, ResearchData, OutfitRecommendation } from "@/types/chatbot";

interface StreamEvent {
  type: "status" | "complete" | "error";
  message?: string;
  step?: number;
  totalSteps?: number;
  data?: {
    text: string;
    weather: WeatherData;
    research: ResearchData;
    outfitRecommendation?: OutfitRecommendation;
  };
}

interface ChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Chatbot({ isOpen = true, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [currentResearch, setCurrentResearch] = useState<ResearchData | null>(null);
  const [currentOutfit, setCurrentOutfit] = useState<OutfitRecommendation | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [streamStatus, setStreamStatus] = useState("");
  const [streamStep, setStreamStep] = useState(0);
  const [streamTotalSteps, setStreamTotalSteps] = useState(0);
  const [statusHistory, setStatusHistory] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowChat(true), 100);
    } else {
      setShowChat(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setCurrentWeather(null);
    setCurrentResearch(null);
    setCurrentOutfit(null);
    setStreamStatus("Starting...");
    setStreamStep(0);
    setStreamTotalSteps(0);
    setStatusHistory([]);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const chunk of lines) {
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          const json = dataLine.slice(6);
          let event: StreamEvent;
          try {
            event = JSON.parse(json);
          } catch {
            continue;
          }

          if (event.type === "status") {
            const nextStatus = event.message || "Working...";
            setStreamStatus(nextStatus);
            setStreamStep(event.step || 0);
            setStreamTotalSteps(event.totalSteps || 0);

            setStatusHistory((prev) => {
              if (prev[prev.length - 1] === nextStatus) return prev;
              return [...prev, nextStatus];
            });
          } else if (event.type === "complete" && event.data) {
            setCurrentWeather(event.data.weather);
            setCurrentResearch(event.data.research);
            setCurrentOutfit(event.data.outfitRecommendation || null);

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? {
                      ...msg,
                      content: event.data!.text,
                      weatherData: event.data!.weather,
                      researchData: event.data!.research,
                      outfitRecommendation: event.data!.outfitRecommendation,
                      isLoading: false,
                    }
                  : msg
              )
            );
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: `Error: ${errorMessage}`, isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentWeather(null);
    setCurrentResearch(null);
    setCurrentOutfit(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-[calc(100vw-2rem)] md:w-[420px] lg:w-[480px] max-h-[80vh] bg-background rounded-2xl border border-border/50 shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-label="Travel outfit chatbot"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Travel Outfit Advisor</h3>
                  <p className="text-xs text-muted-foreground">AI-powered recommendations</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={clearChat}
                  disabled={messages.length === 0}
                  aria-label="Clear chat"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onClose}
                  aria-label="Close chatbot"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh] md:max-h-[60vh]">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Going somewhere?</h4>
                  <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                    Tell me your destination and date, like{" "}
                    <span className="text-primary font-medium">&quot;Kyoto, next wednesday&quot;</span>
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {["Paris, this weekend", "Tokyo, next Monday", "New York, in 2 weeks"].map(
                      (example) => (
                        <button
                          key={example}
                          onClick={() => setInput(example)}
                          className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors"
                        >
                          {example}
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50"
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{streamStatus || "Getting recommendations..."}</span>
                          {streamTotalSteps > 0 && (
                            <span className="text-xs">({Math.max(streamStep, 1)}/{streamTotalSteps})</span>
                          )}
                        </div>
                        {statusHistory.length > 0 && (
                          <div className="space-y-1">
                            {statusHistory.slice(-4).map((status, idx) => {
                              const isLatest = idx === statusHistory.slice(-4).length - 1;
                              return (
                                <div
                                  key={`${status}-${idx}`}
                                  className={`text-xs ${isLatest ? "text-foreground" : "text-muted-foreground"}`}
                                >
                                  {isLatest ? "• " : "✓ "}
                                  {status}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                </motion.div>
              ))}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              {currentWeather && (
                <WeatherBadge weather={currentWeather} className="mt-4" />
              )}

              {currentResearch && (
                <ResearchDisplay research={currentResearch} className="mt-4" />
              )}

              {currentOutfit && (
                <OutfitRecommendationDisplay recommendation={currentOutfit} className="mt-4" />
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-border/50 bg-secondary/20"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter destination and date..."
                    disabled={isLoading}
                    className="pr-10"
                    aria-label="Chat input"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-xs">|</span>
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!showChat && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => isOpen && setShowChat(true)}
          className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Open travel outfit advisor"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">Going somewhere?</span>
        </motion.button>
      )}
    </div>
  );
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 md:h-12 md:w-12 shadow-lg"
          aria-label="Open travel outfit advisor"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>
      <Chatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
