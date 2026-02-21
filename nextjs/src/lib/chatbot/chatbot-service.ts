import { getWeather } from "./weather-service";
import { researchClothing, generateOutfitRecommendation } from "./research-service";
import { parseLocationDateInput, validateParsedInput, formatDateForDisplay } from "./nlp-parser";
import { createClient } from "@/lib/supabase/server";
import type { WeatherData, ResearchData, OutfitRecommendation } from "@/types/chatbot";

export interface ChatbotResponse {
  location: string;
  date: string;
  weather: WeatherData;
  research: ResearchData;
  outfitRecommendation?: OutfitRecommendation;
  wardrobeItems?: Array<{ id: string; name: string; category: string; imageUrl: string }>;
}

type StatusReporter = (message: string, step: number, totalSteps: number) => void;

export async function processChatbotInput(
  userInput: string,
  onStatus?: StatusReporter
): Promise<ChatbotResponse> {
  const totalSteps = 6;
  onStatus?.("Understanding destination and date...", 1, totalSteps);
  const parsed = parseLocationDateInput(userInput);
  
  if (!parsed) {
    throw new Error("I couldn't understand that format. Please use 'Location, Date' format (e.g., 'Kyoto, next wednesday')");
  }
  
  const validation = validateParsedInput(parsed);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid input");
  }
  
  onStatus?.("Fetching weather data...", 2, totalSteps);
  const weather = await getWeather(parsed.location, parsed.date);
  
  onStatus?.("Researching clothing recommendations...", 3, totalSteps);
  const research = await researchClothing(parsed.location, weather, parsed.date);
  
  let outfitRecommendation: OutfitRecommendation | undefined;
  let wardrobeItems: Array<{ id: string; name: string; category: string; imageUrl: string }> = [];
  
  try {
    onStatus?.("Checking your wardrobe for matching pieces...", 4, totalSteps);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (user) {
      const { data: items } = await supabase
        .from("wardrobe_items")
        .select("id, name, category, segmented_image_url, original_image_url")
        .eq("user_id", user.id)
        .limit(20);
      
      if (items && items.length > 0) {
        wardrobeItems = items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          imageUrl: item.segmented_image_url || item.original_image_url,
        }));
        
        onStatus?.("Building your outfit from wardrobe items...", 5, totalSteps);
        const recommendation = await generateOutfitRecommendation(wardrobeItems, weather, research);
        outfitRecommendation = {
          items: recommendation.items,
          summary: recommendation.summary,
        };
      } else {
        onStatus?.("No saved wardrobe items found, using generic tips...", 5, totalSteps);
      }
    } else {
      onStatus?.("Sign in detected no user session, using generic tips...", 5, totalSteps);
    }
  } catch (error) {
    console.error("Wardrobe fetch error:", error);
    onStatus?.("Couldn't access wardrobe, continuing with weather-based guidance...", 5, totalSteps);
  }

  onStatus?.("Finalizing your travel outfit guide...", 6, totalSteps);
  
  return {
    location: parsed.location,
    date: formatDateForDisplay(parsed.date),
    weather,
    research,
    outfitRecommendation,
    wardrobeItems,
  };
}

export function generateResponseText(response: ChatbotResponse): string {
  const { weather, research, outfitRecommendation } = response;
  
  let text = `Here's your travel outfit guide for **${response.location}** on **${response.date}**!\n\n`;
  text += `## Weather\n`;
  text += `🌡️ ${weather.temperature}°C · ${weather.icon} ${weather.condition}\n`;
  text += `💧 Humidity: ${weather.humidity}% · 💨 Wind: ${weather.windSpeed} km/h\n\n`;
  
  text += `## What to Wear\n`;
  text += research.recommendedClothing.slice(0, 5).map((item) => `• ${item}`).join("\n");
  text += `\n\n`;
  
  text += `## Tips\n`;
  text += research.packingTips.slice(0, 3).map((tip) => `• ${tip}`).join("\n");
  
  if (outfitRecommendation && outfitRecommendation.items.length > 0) {
    text += `\n\n## From Your Wardrobe\n`;
    text += outfitRecommendation.summary;
  }
  
  return text;
}
