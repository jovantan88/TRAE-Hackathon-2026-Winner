"use client";

import { motion } from "framer-motion";
import type { WeatherData } from "@/types/chatbot";
import { CloudRain, Wind, Droplets, Sun, Cloud, CloudSnow, CloudLightning, CloudFog } from "lucide-react";

interface WeatherBadgeProps {
  weather: WeatherData;
  className?: string;
}

function getWeatherIcon(condition: string) {
  const lower = condition.toLowerCase();
  if (lower.includes("clear") || lower.includes("sun")) return <Sun className="h-5 w-5" />;
  if (lower.includes("cloud")) return <Cloud className="h-5 w-5" />;
  if (lower.includes("rain") || lower.includes("drizzle")) return <CloudRain className="h-5 w-5" />;
  if (lower.includes("snow")) return <CloudSnow className="h-5 w-5" />;
  if (lower.includes("thunder")) return <CloudLightning className="h-5 w-5" />;
  if (lower.includes("mist") || lower.includes("fog") || lower.includes("haze")) return <CloudFog className="h-5 w-5" />;
  return <Sun className="h-5 w-5" />;
}

function getTemperatureColor(temp: number): string {
  if (temp <= 0) return "text-blue-600";
  if (temp <= 10) return "text-blue-400";
  if (temp <= 20) return "text-green-500";
  if (temp <= 28) return "text-yellow-500";
  return "text-orange-600";
}

export function WeatherBadge({ weather, className = "" }: WeatherBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-gradient-to-br from-card to-card/80 rounded-xl p-4 border border-border/50 shadow-sm ${className}`}
      role="region"
      aria-label={`Weather in ${weather.location}: ${weather.temperature} degrees ${weather.condition}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            {getWeatherIcon(weather.condition)}
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{weather.location}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getTemperatureColor(weather.temperature)}`}>
                {weather.temperature}°C
              </span>
              <span className="text-sm text-muted-foreground">{weather.condition}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      {weather.forecast && weather.forecast.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/30">
          <p className="text-xs font-medium text-muted-foreground mb-2">5-Day Forecast</p>
          <div className="flex gap-2 overflow-x-auto">
            {weather.forecast.slice(0, 5).map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center gap-1 min-w-[50px] p-2 rounded-lg bg-background/50"
              >
                <span className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                </span>
                <span className="text-lg">{day.icon}</span>
                <span className="text-xs font-medium">{Math.round(day.temperature)}°</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
