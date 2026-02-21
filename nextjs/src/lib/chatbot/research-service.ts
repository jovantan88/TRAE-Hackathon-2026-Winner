import { GoogleGenAI } from "@google/genai";
import type { ResearchData, WeatherData } from "@/types/chatbot";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = "gemini-2.5-flash";

const RESEARCH_PROMPT = `You are a travel fashion expert. Based on the destination and weather conditions provided, research and provide detailed clothing recommendations.

Destination: {location}
Weather: {temperature}°C, {condition}
Date: {date}

Provide a JSON response with the following structure:
{
  "climateInfo": "Brief overview of the climate at this destination during this time of year",
  "culturalNotes": "Any cultural considerations for dress (e.g., religious sites, business attire)",
  "recommendedClothing": ["list of specific clothing items appropriate for this weather"],
  "packingTips": ["list of essential packing tips for this trip"]
}

Focus on practical, weather-appropriate suggestions.`;

export async function researchClothing(
  location: string,
  weather: WeatherData,
  date: Date
): Promise<ResearchData> {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = RESEARCH_PROMPT
    .replace("{location}", location)
    .replace("{temperature}", weather.temperature.toString())
    .replace("{condition}", weather.condition)
    .replace("{date}", dateStr);

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    
    if (!text) {
      return getDefaultResearch(location, weather);
    }

    const parsed = JSON.parse(text);
    
    return {
      location,
      climateInfo: parsed.climateInfo || "",
      culturalNotes: parsed.culturalNotes || "",
      recommendedClothing: parsed.recommendedClothing || [],
      packingTips: parsed.packingTips || [],
    };
  } catch (error) {
    console.error("Research error:", error);
    return getDefaultResearch(location, weather);
  }
}

function getDefaultResearch(location: string, weather: WeatherData): ResearchData {
  const temp = weather.temperature;
  const isCold = temp < 15;
  const isHot = temp > 25;
  const isRainy = weather.condition.toLowerCase().includes("rain");

  const clothing: string[] = [];
  const tips: string[] = [];

  if (isCold) {
    clothing.push("Warm jacket or coat", "Sweaters or thermal layers", "Long pants", "Closed-toe shoes", "Scarf and gloves");
    tips.push("Layer your clothing for warmth", "Check if accommodation has heating");
  } else if (isHot) {
    clothing.push("Light, breathable clothing", "Short-sleeve shirts", "Shorts or light pants", "Sunglasses", "Sun hat");
    tips.push("Stay hydrated", "Use sunscreen", "Seek shade during peak sun hours");
  } else {
    clothing.push("Light layers", "Comfortable walking shoes", "Versatile outfits", "Light jacket for evening");
    tips.push("Bring layers for varying temperatures");
  }

  if (isRainy) {
    clothing.push("Waterproof jacket", "Umbrella", "Water-resistant shoes");
    tips.push("Check weather forecast daily", "Keep electronics protected");
  }

  return {
    location,
    climateInfo: `Current weather in ${location}: ${weather.temperature}°C, ${weather.condition}. This temperature suggests ${isCold ? "cold" : isHot ? "warm" : "mild"} conditions.`,
    culturalNotes: "Dress modestly when visiting religious sites. Check local customs before your trip.",
    recommendedClothing: clothing,
    packingTips: tips,
  };
}

const OUTFIT_PROMPT = `You are a fashion stylist. Based on the user's wardrobe items, current weather, and research findings, recommend the best outfit combination.

User's Wardrobe Items:
{wardrobe}

Weather Conditions:
- Temperature: {temperature}°C
- Condition: {condition}
- Humidity: {humidity}%

Research Recommendations:
{research}

Provide a JSON response with:
{
  "summary": "Brief explanation of why this outfit works for the weather and occasion",
  "recommendedItems": [
    {"id": "item_id", "category": "category_name", "reason": "why this item was chosen"}
  ]
}

Select items that match the weather conditions. Prioritize practical combinations.`;

export async function generateOutfitRecommendation(
  wardrobeItems: Array<{ id: string; name: string; category: string; imageUrl: string }>,
  weather: WeatherData,
  research: ResearchData
): Promise<{ items: Array<{ id: string; name: string; category: string; imageUrl: string; reason: string }>; summary: string }> {
  const researchInfo = `Recommended: ${research.recommendedClothing.slice(0, 5).join(", ")}`;
  
  const wardrobeList = wardrobeItems
    .map((item) => `- ${item.name} (${item.category})`)
    .join("\n");

  const prompt = OUTFIT_PROMPT
    .replace("{wardrobe}", wardrobeList || "No specific items provided")
    .replace("{temperature}", weather.temperature.toString())
    .replace("{condition}", weather.condition)
    .replace("{humidity}", weather.humidity.toString())
    .replace("{research}", researchInfo);

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    
    if (!text) {
      return getDefaultOutfitRecommendation(wardrobeItems, weather);
    }

    const parsed = JSON.parse(text);
    
    const items = (parsed.recommendedItems || []).map((rec: { id: string; category: string; reason: string }) => {
      const wardrobeItem = wardrobeItems.find((w) => w.id === rec.id) || wardrobeItems.find((w) => w.category === rec.category);
      return {
        id: wardrobeItem?.id || rec.id,
        name: wardrobeItem?.name || rec.category,
        category: rec.category,
        imageUrl: wardrobeItem?.imageUrl || "",
        reason: rec.reason,
      };
    });

    return {
      items,
      summary: parsed.summary || "Based on the weather conditions, here's a recommended outfit.",
    };
  } catch (error) {
    console.error("Outfit recommendation error:", error);
    return getDefaultOutfitRecommendation(wardrobeItems, weather);
  }
}

function getDefaultOutfitRecommendation(
  wardrobeItems: Array<{ id: string; name: string; category: string; imageUrl: string }>,
  weather: WeatherData
): { items: Array<{ id: string; name: string; category: string; imageUrl: string; reason: string }>; summary: string } {
  const temp = weather.temperature;
  const categoryMap: Record<string, string[]> = {
    tops: ["tops", "shirts", "t-shirts", "blouses"],
    bottoms: ["bottoms", "pants", "shorts", "skirts"],
    outerwear: ["outerwear", "jackets", "coats"],
    shoes: ["shoes", "footwear"],
    accessories: ["accessories", "hats", "scarves"],
  };

  const recommended: Array<{ id: string; name: string; category: string; imageUrl: string; reason: string }> = [];

  if (temp < 15) {
    const outerwear = wardrobeItems.find((w) => categoryMap.outerwear.some((c) => w.category.toLowerCase().includes(c)));
    if (outerwear) {
      recommended.push({ ...outerwear, reason: "Warm layer for cold weather" });
    }
  }

  const tops = wardrobeItems.filter((w) => categoryMap.tops.some((c) => w.category.toLowerCase().includes(c)));
  if (tops.length > 0) {
    recommended.push({ ...tops[0], reason: temp > 25 ? "Breathable top for warm weather" : "Comfortable top for mild weather" });
  }

  const bottoms = wardrobeItems.filter((w) => categoryMap.bottoms.some((c) => w.category.toLowerCase().includes(c)));
  if (bottoms.length > 0) {
    recommended.push({ ...bottoms[0], reason: "Comfortable bottom for walking" });
  }

  if (weather.condition.toLowerCase().includes("rain")) {
    const accessories = wardrobeItems.filter((w) => categoryMap.accessories.some((c) => w.category.toLowerCase().includes(c)));
    if (accessories.length > 0) {
      recommended.push({ ...accessories[0], reason: "Protection from rain" });
    }
  }

  return {
    items: recommended,
    summary: `For ${weather.temperature}°C and ${weather.condition} weather, I recommend layering appropriately and choosing comfortable, weather-appropriate pieces.`,
  };
}
