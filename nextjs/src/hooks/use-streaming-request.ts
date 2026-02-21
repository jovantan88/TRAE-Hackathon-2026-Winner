"use client";

import { useState, useCallback, useRef } from "react";
import type { StreamEvent } from "@/lib/stream";

interface StreamingState<T> {
  status: string;
  step: number;
  totalSteps: number;
  isStreaming: boolean;
  result: T | null;
  error: string | null;
}

export function useStreamingRequest<T = Record<string, unknown>>() {
  const [state, setState] = useState<StreamingState<T>>({
    status: "",
    step: 0,
    totalSteps: 0,
    isStreaming: false,
    result: null,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (url: string, body: Record<string, unknown>): Promise<T | null> => {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;
      let completeResult: T | null = null;
      let streamError: string | null = null;

      setState({
        status: "Starting...",
        step: 0,
        totalSteps: 0,
        isStreaming: true,
        result: null,
        error: null,
      });

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortController.signal,
        });

        if (!res.ok) {
          // Non-streaming error (auth, validation)
          const errorData = await res.json();
          throw new Error(errorData.error || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const chunk of lines) {
            const dataLine = chunk
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!dataLine) continue;

            const json = dataLine.slice(6);
            let event: StreamEvent;
            try {
              event = JSON.parse(json);
            } catch {
              continue;
            }

            if (event.type === "status") {
              setState((prev) => ({
                ...prev,
                status: event.message,
                step: event.step,
                totalSteps: event.totalSteps,
              }));
            } else if (event.type === "complete") {
              completeResult = event.data as T;
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                result: event.data as T,
                status: "Complete",
                step: prev.totalSteps,
              }));
            } else if (event.type === "error") {
              streamError = event.message;
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                error: event.message,
                status: "",
              }));
            }
          }
        }

        if (streamError) {
          throw new Error(streamError);
        }

        return completeResult;
      } catch (err) {
        if ((err as Error).name === "AbortError") return null;
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: err instanceof Error ? err.message : "Something went wrong",
          status: "",
        }));
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      status: "",
      step: 0,
      totalSteps: 0,
      isStreaming: false,
      result: null,
      error: null,
    });
  }, []);

  return { ...state, execute, reset };
}
