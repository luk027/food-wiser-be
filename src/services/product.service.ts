import { eq } from "drizzle-orm";
import { db } from "@db/connection";
import { products } from "@db/schema/product";
import { logger } from "@utils/logger.util";
import { env } from "@config/env.ts";
import { fetchOFFData } from "@/utils/helper/fetchOFFData";
import { extractOFFData } from "@/utils/helper/extractOFFFields";
import { checkDataCompleteness } from "@/utils/helper/checkDataCompleteness";
import { deriveDietaryStatus } from "@/utils/helper/deriveDietaryStatus";
import { classifyHalalStatus } from "@/utils/helper/classifyHalalStatus";
import { enrichMissingFields } from "@/utils/helper/selectiveEnrichment";
import { generateBasicOverview } from "@/utils/helper/generateBasicOverview";
import { getAPIKey } from "@/utils/helper/models/getAPIKey";

export async function getProductData({
  barcode,
  userApiKey,
}: {
  barcode: string;
  userApiKey?: string;
}) {
  //1. Return product data from DB if available
  const [cachedProduct] = await db
    .select()
    .from(products)
    .where(eq(products.barcode, barcode))
    .limit(1);
  if (cachedProduct) {
    logger.info(`Cache hit for barcode: ${barcode}`);
    return cachedProduct;
  }

  //2. Get data from OFF API if not present in DB
  const offData = await fetchOFFData(barcode);
  const extractedData = extractOFFData(offData.product);
  const gaps = checkDataCompleteness(extractedData);

  logger.info(`Product ${barcode} completeness: ${gaps.completeness}%`);

  const dietaryStatus = deriveDietaryStatus(extractedData.ingredientsAnalysis);

  let halalStatus: "halal" | "haram" | "doubtful" | "unknown" = "unknown";
  if (extractedData.ingredients || extractedData.additives.length > 0) {
    halalStatus = await classifyHalalStatus(
      extractedData.ingredients,
      extractedData.additives,
    );
  }

  //3. Determine if AI enrichment is needed
  const needsAI =
    gaps.missingCritical.length > 0 ||
    gaps.needsTranslation.length > 0 ||
    halalStatus === "unknown" ||
    gaps.completeness < 60;

  let aiEnriched: any = {};
  let dataSource = "off-only";
  let lastEnriched = null;

  if (needsAI) {
    logger.info(`AI enrichment needed for barcode: ${barcode}`);
    try {
      // ✨ Determine which API key to use with proper fallback
      const apiKey = getAPIKey(userApiKey, env.AI_MODEL);
      aiEnriched = await enrichMissingFields(
        extractedData,
        gaps,
        apiKey,
        barcode,
      );

      if (aiEnriched.halalStatus && halalStatus === "unknown") {
        halalStatus = aiEnriched.halalStatus;
      }

      if (aiEnriched.ingredientsTranslated) {
        extractedData.ingredients = aiEnriched.ingredientsTranslated;
      }

      if (aiEnriched.allergens && !extractedData.allergens) {
        extractedData.allergens = aiEnriched.allergens;
      }

      if (aiEnriched.additives && extractedData.additives.length === 0) {
        extractedData.additives = aiEnriched.additives;
      }

      dataSource = gaps.completeness < 40 ? "ai-heavy" : "off+ai";
      lastEnriched = new Date();
    } catch (error) {
      logger.error(`AI enrichment failed: ${(error as Error).message}`);
    }
  }

  const overview =
    aiEnriched.overview || generateBasicOverview(offData.product);

  const finalData = {
    ...extractedData,
    dietaryStatus,
    halalStatus,
    overview,
    dataCompleteness: gaps.completeness,
    dataSource,
    lastEnriched,
  };

  const [newProduct] = await db
    .insert(products)
    .values({ barcode, ...finalData })
    .returning();

  logger.info(`Product ${barcode} saved with ${dataSource} source`);

  return newProduct;
}
