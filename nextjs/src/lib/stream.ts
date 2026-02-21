// Server-side: create an SSE stream response
export type StreamEvent =
  | { type: "status"; message: string; step: number; totalSteps: number }
  | { type: "complete"; data: Record<string, unknown> }
  | { type: "error"; message: string };

export function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  function send(event: StreamEvent) {
    const data = JSON.stringify(event);
    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
  }

  function close() {
    controller.close();
  }

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  return { send, close, response };
}
