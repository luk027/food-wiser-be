import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@utils/logger.util";
import { getProductEnrichmentPrompt } from "./prompt";
import { geminiResponseSchema } from "@/validations/product.validations";

//Use Gemini to clean and structure data
export async function enrichWithGemini(data: any, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = getProductEnrichmentPrompt(data);
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    
    const rawParsed = JSON.parse(jsonMatch[0]);
    return geminiResponseSchema.parse(rawParsed);
  } catch (error) {
    logger.error(`AI Validation Error: ${(error as Error).message}`);
    throw error;
  }
}
