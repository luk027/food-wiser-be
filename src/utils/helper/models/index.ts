import { env } from "@config/env";
import { geminiEnricher } from "./enhanceWithGemini";
import { groqEnricher } from "./enhanceWithGroq";
import type { AIEnricher, AIModelType } from "./types";

const modelRegistry: Record<AIModelType, AIEnricher> = {
  gemini: geminiEnricher,
  groq: groqEnricher,
};

export function getAIEnricher(): AIEnricher {
  return modelRegistry[env.AI_MODEL];
}

export function getAIEnricherByName(modelName: AIModelType): AIEnricher {
  const enricher = modelRegistry[modelName];
  if (!enricher) {
    throw new Error(`Unknown AI model: ${modelName}`);
  }
  return enricher;
}

// Re-export types and helpers
export type { AIEnricher, AIModelType } from "./types";
export { getAPIKey } from "./getAPIKey";
