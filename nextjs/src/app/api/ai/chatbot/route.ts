import { createSSEStream } from "@/lib/stream";
import { processChatbotInput, generateResponseText } from "@/lib/chatbot/chatbot-service";

export async function POST(request: Request) {
  const { send, close, response } = createSSEStream();

  void (async () => {
    try {
      const { message } = await request.json();

      if (!message || typeof message !== "string") {
        throw new Error("Message is required");
      }

      const chatbotResponse = await processChatbotInput(message, (statusMessage, step, totalSteps) => {
        send({
          type: "status",
          message: statusMessage,
          step,
          totalSteps,
        });
      });

      const responseText = generateResponseText(chatbotResponse);

      send({
        type: "complete",
        data: {
          text: responseText,
          weather: chatbotResponse.weather,
          research: chatbotResponse.research,
          outfitRecommendation: chatbotResponse.outfitRecommendation,
        },
      });
    } catch (error) {
      console.error("Chatbot error:", error);
      send({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      close();
    }
  })();

  return response;
}
