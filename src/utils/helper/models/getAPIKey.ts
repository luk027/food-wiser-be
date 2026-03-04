import { env } from "@config/env";
import type { AIModelType } from "./types";

export function getAPIKey(
  userApiKey: string | undefined,
  modelType: AIModelType,
): string {
  // User-provided key takes precedence
  if (userApiKey) {
    return userApiKey;
  }

  // Get key from environment based on model
  switch (modelType) {
    case "gemini":
      return env.GEMINI_API_KEY;

    case "groq":
      if (!env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not configured but groq model selected");
      }
      return env.GROQ_API_KEY;

    default:
      throw new Error(`Unknown model type: ${modelType}`);
  }
}
