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

      send({
        type: "status",
        message: "Analyzing your request...",
        step: 1,
        totalSteps: 4,
      });

      send({
        type: "status",
        message: "Fetching weather data...",
        step: 2,
        totalSteps: 4,
      });

      const chatbotResponse = await processChatbotInput(message);

      send({
        type: "status",
        message: "Researching clothing recommendations...",
        step: 3,
        totalSteps: 4,
      });

      if (chatbotResponse.wardrobeItems && chatbotResponse.wardrobeItems.length > 0) {
        send({
          type: "status",
          message: "Finding matching items from your wardrobe...",
          step: 4,
          totalSteps: 4,
        });
      }

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
