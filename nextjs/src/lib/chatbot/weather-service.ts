import type { WeatherData, ForecastDay } from "@/types/chatbot";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = "https://api.tavily.com/search";

function extractTemperature(text: string): number | null {
  const fahrenheitMatch = text.match(/(\d+)\s*(?:degrees?\s*)?f(?:ahrenheit)?\b/i);
  if (fahrenheitMatch) {
    const fTemp = parseInt(fahrenheitMatch[1], 10);
    return Math.round((fTemp - 32) * 5 / 9);
  }

  const patterns = [
    /(\d+)\s*degrees?\s*(?:celsius|c|centigrade)/i,
    /(\d+)\s*°\s*c/i,
    /temperature\s*(?:of\s*)?(\d+)/i,
    /(\d+)\s*°?\s*(?:degrees?)?\s*(?:today|currently)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp > 50 && temp <= 130) {
        return Math.round((temp - 32) * 5 / 9);
      }
      if (temp >= -50 && temp <= 60) {
        return temp;
      }
    }
  }

  const numbers = text.match(/\b(\d{2})\b/g);
  if (numbers) {
    for (const num of numbers) {
      const temp = parseInt(num, 10);
      if (temp > 50 && temp <= 130) {
        return Math.round((temp - 32) * 5 / 9);
      }
      if (temp >= -50 && temp <= 50) {
        return temp;
      }
    }
  }

  return null;
}

function extractCondition(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("sunny") || lower.includes("clear")) return "Clear";
  if (lower.includes("partly cloudy") || lower.includes("partly cloud")) return "Partly Cloudy";
  if (lower.includes("cloudy") || lower.includes("overcast")) return "Cloudy";
  if (lower.includes("rain") || lower.includes("rainy") || lower.includes("showers")) return "Rain";
  if (lower.includes("drizzle")) return "Drizzle";
  if (lower.includes("thunder") || lower.includes("storm") || lower.includes("lightning")) return "Thunderstorm";
  if (lower.includes("snow") || lower.includes("snowy") || lower.includes("blizzard")) return "Snow";
  if (lower.includes("mist") || lower.includes("fog") || lower.includes("foggy")) return "Mist";
  if (lower.includes("wind") || lower.includes("windy")) return "Windy";
  if (lower.includes("hot") || lower.includes("heat")) return "Hot";
  if (lower.includes("cold") || lower.includes("cool")) return "Cold";

  return "Unknown";
}

function getWeatherIcon(condition: string): string {
  const iconMap: Record<string, string> = {
    clear: "☀️",
    "partly cloudy": "⛅",
    cloudy: "☁️",
    rain: "🌧️",
    drizzle: "🌦️",
    thunderstorm: "⛈️",
    snow: "❄️",
    mist: "🌫️",
    fog: "🌫️",
    windy: "💨",
    hot: "🔥",
    cold: "🥶",
  };

  const lower = condition.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) {
      return icon;
    }
  }
  return "🌡️";
}

function extractHumidity(text: string): number | null {
  const match = text.match(/(\d{1,2})\s*%?\s*(?:humidity|humid)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  const humidityMatch = text.match(/humidity[:\s]*(\d{1,2})/i);
  if (humidityMatch) {
    return parseInt(humidityMatch[1], 10);
  }

  return 50;
}

function extractWindSpeed(text: string): number | null {
  const patterns = [
    /(\d+)\s*(?:km\/h|kph)/i,
    /wind[:\s]*(\d+)/i,
    /(\d+)\s*(?:mph)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let speed = parseInt(match[1], 10);
      const isMph = pattern.toString().includes("mph");
      if (isMph) {
        speed = Math.round(speed * 1.60934);
      }
      return speed;
    }
  }

  return null;
}

async function searchWeatherWithTavily(location: string, targetDate?: Date): Promise<WeatherData> {
  if (!TAVILY_API_KEY) {
    throw new Error("Tavily API key not configured. Please set TAVILY_API_KEY in your environment.");
  }

  const dateStr = targetDate
    ? targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  const query = dateStr
    ? `current weather in ${location} on ${dateStr}`
    : `current weather in ${location} today`;

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      api_key: TAVILY_API_KEY,
      include_answer: true,
      include_raw_content: false,
      max_results: 5,
      search_depth: "basic",
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API failed: ${response.statusText}`);
  }

  const data = await response.json();

  const answerText = data.answer || "";
  const resultsText = data.results?.map((r: { content: string }) => r.content).join(" ") || "";
  const combinedText = `${answerText} ${resultsText}`;

  if (!combinedText.trim()) {
    throw new Error(`No weather data found for ${location}`);
  }

  const temperature = extractTemperature(combinedText);
  const condition = extractCondition(combinedText);
  const humidity = extractHumidity(combinedText);
  const windSpeed = extractWindSpeed(combinedText);

  const weatherData: WeatherData = {
    location,
    temperature: temperature ?? 20,
    condition,
    humidity: humidity ?? 50,
    windSpeed: windSpeed ?? 10,
    icon: getWeatherIcon(condition),
  };

  if (targetDate && targetDate > new Date()) {
    const forecastQuery = `weather forecast for ${location} in ${targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
    
    const forecastResponse = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: forecastQuery,
        api_key: TAVILY_API_KEY,
        include_answer: true,
        max_results: 3,
        search_depth: "basic",
      }),
    });

    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json();
      const forecastText = forecastData.answer || "";

      if (forecastText) {
        const forecastTemp = extractTemperature(forecastText);
        const forecastCondition = extractCondition(forecastText);

        if (forecastTemp) weatherData.temperature = forecastTemp;
        if (forecastCondition !== "Unknown") weatherData.condition = forecastCondition;
        weatherData.icon = getWeatherIcon(weatherData.condition);

        weatherData.forecast = [];
        for (let i = 1; i <= 5; i++) {
          const forecastDate = new Date();
          forecastDate.setDate(forecastDate.getDate() + i);
          weatherData.forecast.push({
            date: forecastDate.toISOString().split("T")[0],
            temperature: forecastTemp ?? 20,
            tempMin: (forecastTemp ?? 20) - 5,
            tempMax: (forecastTemp ?? 20) + 5,
            condition: forecastCondition,
            icon: getWeatherIcon(forecastCondition),
          });
        }
      }
    }
  }

  return weatherData;
}

export async function getWeather(location: string, targetDate?: Date): Promise<WeatherData> {
  return searchWeatherWithTavily(location, targetDate);
}

export async function getWeatherForDate(location: string, targetDate: Date): Promise<WeatherData> {
  return searchWeatherWithTavily(location, targetDate);
}
