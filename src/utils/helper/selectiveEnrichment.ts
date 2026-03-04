import { logger } from "@utils/logger.util";
import { env } from "@config/env";
import type { DataGaps } from "./checkDataCompleteness";
import { getAIEnricher } from "./models";

export async function enrichMissingFields(
  offData: any,
  gaps: DataGaps,
  apiKey: string,
  barcode: string,
): Promise<any> {
  if (gaps.completeness > 80 && gaps.missingCritical.length === 0) {
    logger.info("Data completeness sufficient, skipping AI enrichment");
    return {};
  }

  const minimalData = {
    barcode,
    productName: offData.name || "Unknown Product",
    ingredients: offData.ingredients || "",
    additives: offData.additives || [],
    allergens: offData.allergens || "",
    categories: offData.categories || [],
  };

  try {
    const enricher = getAIEnricher();
    logger.info(`Using AI model: ${env.AI_MODEL} for barcode: ${barcode}`);

    const result = await enricher.enrich(minimalData, apiKey);
    return result;
  } catch (error) {
    logger.error(`AI enrichment failed: ${(error as Error).message}`);
    throw error;
  }
}
