export interface ParsedInput {
  location: string;
  date: Date;
  rawDate: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  forecast?: ForecastDay[];
}

export interface ForecastDay {
  date: string;
  temperature: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
}

export interface ResearchData {
  location: string;
  climateInfo: string;
  culturalNotes: string;
  recommendedClothing: string[];
  packingTips: string[];
}

export interface OutfitRecommendation {
  items: {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    reason: string;
  }[];
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  weatherData?: WeatherData;
  researchData?: ResearchData;
  outfitRecommendation?: OutfitRecommendation;
  isLoading?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export type ChatAction =
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_LAST_MESSAGE"; payload: Partial<ChatMessage> }
  | { type: "CLEAR_CHAT" };
