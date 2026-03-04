import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@utils/logger.util";
import { AIResponseSchema } from "@/validations/product.validations";
import { getProductEnrichmentPrompt } from "./prompt";
import type { AIEnricher } from "./types";

class GeminiEnricher implements AIEnricher {
  async enrich(
    minimalData: {
      barcode: string;
      productName: string;
      ingredients: string;
      additives: string[];
      allergens: string;
      categories: string[];
    },
    apiKey: string,
  ) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1, // factual, low-creativity responses
        topP: 0.85,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
      },
      systemInstruction:
        "You are a certified food-safety analyst and halal compliance expert. " +
        "Always respond with a single, valid JSON object — no markdown, no code fences, no extra text.",
    });

    const prompt = getProductEnrichmentPrompt(minimalData);

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Strip markdown code fences if present (safety net)
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

      if (!jsonMatch) throw new Error("No JSON found in AI response");

      const rawParsed = JSON.parse(jsonMatch[0]);
      return AIResponseSchema.parse(rawParsed);
    } catch (error) {
      logger.error(`Gemini enrichment failed: ${(error as Error).message}`);
      throw error;
    }
  }
}

export const geminiEnricher = new GeminiEnricher();
