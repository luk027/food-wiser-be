import Groq from "groq-sdk";
import { logger } from "@utils/logger.util";
import { AIResponseSchema } from "@/validations/product.validations";
import { getProductEnrichmentPrompt } from "./prompt";
import type { AIEnricher } from "./types";

class GroqEnricher implements AIEnricher {
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
    const groq = new Groq({ apiKey });
    const prompt = getProductEnrichmentPrompt(minimalData);

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a certified food-safety analyst and halal compliance expert. " +
              "Always respond with a single, valid JSON object — no markdown, no code fences, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1, // lower = more factual / less creative
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(text);
      return AIResponseSchema.parse(parsed);
    } catch (error) {
      logger.error(`Groq enrichment failed: ${(error as Error).message}`);
      throw error;
    }
  }
}

export const groqEnricher = new GroqEnricher();
