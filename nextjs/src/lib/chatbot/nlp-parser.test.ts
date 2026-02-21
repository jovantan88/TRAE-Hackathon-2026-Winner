import { describe, it, expect } from "vitest";
import { parseLocationDateInput, validateParsedInput, formatDateForDisplay, isValidLocation } from "../nlp-parser";

describe("NLP Parser", () => {
  describe("parseLocationDateInput", () => {
    it("should parse location and date with comma separator", () => {
      const result = parseLocationDateInput("Kyoto, next wednesday");
      expect(result).not.toBeNull();
      expect(result?.location).toBe("Kyoto");
      expect(result?.rawDate).toBe("next wednesday");
    });

    it("should parse location and today", () => {
      const result = parseLocationDateInput("Paris, today");
      expect(result).not.toBeNull();
      expect(result?.location).toBe("Paris");
    });

    it("should parse location and tomorrow", () => {
      const result = parseLocationDateInput("Tokyo, tomorrow");
      expect(result).not.toBeNull();
      expect(result?.location).toBe("Tokyo");
    });

    it("should parse ISO date format", () => {
      const result = parseLocationDateInput("New York, 2026-03-15");
      expect(result).not.toBeNull();
      expect(result?.location).toBe("New York");
    });

    it("should parse MM/DD/YYYY format", () => {
      const result = parseLocationDateInput("London, 12/25");
      expect(result).not.toBeNull();
      expect(result?.location).toBe("London");
    });

    it("should return null for invalid input", () => {
      const result = parseLocationDateInput("");
      expect(result).toBeNull();
    });

    it("should handle 'in X weeks' format", () => {
      const result = parseLocationDateInput("Hawaii, in 2 weeks");
      expect(result).not.toBeNull();
      expect(result?.location).toBe("Hawaii");
    });

    it("should handle 'this weekend' format", () => {
      const result = parseLocationDateInput("Barcelona, this weekend");
      expect(result).not.toBeNull();
      expect(result?.location).toBe("Barcelona");
    });
  });

  describe("validateParsedInput", () => {
    it("should validate correct input", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const result = validateParsedInput({
        location: "Paris",
        date: futureDate,
        rawDate: "next week",
      });
      
      expect(result.valid).toBe(true);
    });

    it("should reject empty location", () => {
      const result = validateParsedInput({
        location: "",
        date: new Date(),
        rawDate: "today",
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain("valid location");
    });

    it("should reject past dates", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const result = validateParsedInput({
        location: "Paris",
        date: pastDate,
        rawDate: "yesterday",
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain("past");
    });

    it("should reject dates more than 1 year in future", () => {
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 2);
      
      const result = validateParsedInput({
        location: "Paris",
        date: farFutureDate,
        rawDate: "in 2 years",
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain("1 year");
    });
  });

  describe("isValidLocation", () => {
    it("should return true for valid locations", () => {
      expect(isValidLocation("Paris")).toBe(true);
      expect(isValidLocation("San Francisco")).toBe(true);
      expect(isValidLocation("a")).toBe(false);
      expect(isValidLocation("")).toBe(false);
    });

    it("should reject too long locations", () => {
      expect(isValidLocation("a".repeat(101))).toBe(false);
    });
  });

  describe("formatDateForDisplay", () => {
    it("should format date correctly", () => {
      const date = new Date("2026-03-15");
      const formatted = formatDateForDisplay(date);
      expect(formatted).toContain("March");
      expect(formatted).toContain("15");
      expect(formatted).toContain("2026");
    });
  });
});
