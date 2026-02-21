import type { ParsedInput } from "@/types/chatbot";

const DATE_PATTERNS: { pattern: RegExp; parse: (match: string) => Date | null }[] = [
  { pattern: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, parse: parseNextDayOfWeek },
  { pattern: /\b(today|tomorrow)\b/i, parse: parseRelativeDay },
  { pattern: /\b(\d{1,2})\/(\d{1,2})(\/(\d{2,4}))?\b/, parse: parseSlashDate },
  { pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/, parse: parseISODate },
  { pattern: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})(,?\s*(\d{4}))?\b/i, parse: parseMonthDate },
];

function parseNextDayOfWeek(match: string): Date | null {
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
  };
  const dayName = match.toLowerCase().match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)?.[1];
  if (!dayName) return null;
  
  const targetDay = dayMap[dayName];
  const today = new Date();
  const currentDay = today.getDay();
  
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  
  const result = new Date(today);
  result.setDate(today.getDate() + daysUntil);
  return result;
}

function parseRelativeDay(match: string): Date | null {
  const today = new Date();
  if (match.toLowerCase() === "today") return today;
  if (match.toLowerCase() === "tomorrow") {
    today.setDate(today.getDate() + 1);
  }
  return today;
}

function parseSlashDate(match: string): Date | null {
  const parts = match.match(/(\d{1,2})\/(\d{1,2})(\/(\d{2,4}))?/);
  if (!parts) return null;
  
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const year = parts[4] ? parseInt(parts[4], 10) : new Date().getFullYear();
  const fullYear = year < 100 ? 2000 + year : year;
  
  const date = new Date(fullYear, month, day);
  return date;
}

function parseISODate(match: string): Date | null {
  const parts = match.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!parts) return null;
  
  const year = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10) - 1;
  const day = parseInt(parts[3], 10);
  
  return new Date(year, month, day);
}

function parseMonthDate(match: string): Date | null {
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  
  const parts = match.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})(,?\s*(\d{4}))?/i);
  if (!parts) return null;
  
  const monthName = parts[1].toLowerCase().substring(0, 3);
  const month = monthMap[monthName];
  const day = parseInt(parts[2], 10);
  const year = parts[4] ? parseInt(parts[4], 10) : new Date().getFullYear();
  
  return new Date(year, month, day);
}

export function parseLocationDateInput(input: string): ParsedInput | null {
  const trimmed = input.trim();
  
  const GREETINGS = ["hi", "hello", "hey", "greetings", "sup", "yo", "howdy", "good morning", "good afternoon", "good evening"];
  if (GREETINGS.includes(trimmed.toLowerCase())) {
    return {
      location: trimmed,
      date: new Date(),
      rawDate: "today",
    };
  }
  
  let location = "";
  let dateString = "";
  let date: Date | null = null;
  
  const commaIndex = trimmed.lastIndexOf(",");
  if (commaIndex > 0) {
    location = trimmed.substring(0, commaIndex).trim();
    dateString = trimmed.substring(commaIndex + 1).trim();
  } else {
    const words = trimmed.split(/\s+/);
    if (words.length >= 2) {
      location = words.slice(0, -1).join(" ");
      dateString = words[words.length - 1];
    } else {
      location = trimmed;
      dateString = "today";
    }
  }
  
  if (!location || location.length < 2) {
    return null;
  }
  
  for (const { pattern, parse } of DATE_PATTERNS) {
    const match = dateString.match(pattern);
    if (match) {
      date = parse(match[0]);
      break;
    }
  }
  
  if (!date) {
    date = new Date();
  }
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return {
    location: location.replace(/^(the\s+)/i, "").trim(),
    date,
    rawDate: dateString,
  };
}

export function formatDateForDisplay(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

export function isValidLocation(location: string): boolean {
  return location.length >= 2 && location.length <= 100;
}

export function validateParsedInput(parsed: ParsedInput): { valid: boolean; error?: string } {
  if (!parsed.location || parsed.location.length < 2) {
    return { valid: false, error: "Please provide a valid location name" };
  }
  
  const GREETINGS = ["hi", "hello", "hey", "greetings", "sup", "yo", "howdy", "good morning", "good afternoon", "good evening"];
  if (GREETINGS.includes(parsed.location.toLowerCase())) {
    return { valid: false, error: "Hello! Please provide a location and date for your travel outfit recommendation (e.g., 'Paris next week')." };
  }
  
  if (isNaN(parsed.date.getTime())) {
    return { valid: false, error: "Please provide a valid date" };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(parsed.date);
  inputDate.setHours(0, 0, 0, 0);
  
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  
  if (inputDate < today) {
    return { valid: false, error: "Date cannot be in the past" };
  }
  
  if (inputDate > maxDate) {
    return { valid: false, error: "Date cannot be more than 1 year in the future" };
  }
  
  return { valid: true };
}
