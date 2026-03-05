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
  aiMode = "auto", // "auto" | "always" | "never"
}: {
  barcode: string;
  userApiKey?: string;
  aiMode?: "auto" | "always" | "never";
}) {
  // 1. Check cache first
  const [cachedProduct] = await db
    .select()
    .from(products)
    .where(eq(products.barcode, barcode))
    .limit(1);

  if (cachedProduct) {
    // Check if cache is expired
    if (
      cachedProduct.cacheExpiresAt &&
      new Date() > cachedProduct.cacheExpiresAt
    ) {
      logger.info(`Cache expired for ${barcode}, re-fetching`);
      // Delete expired cache entry before continuing
      await db.delete(products).where(eq(products.barcode, barcode));
    } else {
      logger.info(`Cache hit for barcode: ${barcode}`);
      return cachedProduct;
    }
  }

  // 2. Fetch from OFF API
  const offData = await fetchOFFData(barcode);
  const extractedData = extractOFFData(offData.product);
  const gaps = checkDataCompleteness(extractedData);

  logger.info(`Product ${barcode} completeness: ${gaps.completeness}%`);

  // 3. Derive dietary status from OFF data
  const dietaryStatus = deriveDietaryStatus(extractedData.ingredientsAnalysis);

  // 4. Rule-based halal classification
  let halalStatus: "halal" | "haram" | "doubtful" | "unknown" = "unknown";
  if (extractedData.ingredients || extractedData.additives.length > 0) {
    halalStatus = await classifyHalalStatus(
      extractedData.ingredients,
      extractedData.additives
    );
  }

  // 5. Determine if AI enrichment should run
  const needsAI =
    gaps.missingCritical.length > 0 ||
    gaps.needsTranslation.length > 0 ||
    halalStatus === "unknown" ||
    gaps.completeness < 60;

  let shouldRunAI = false;

  if (aiMode === "always") {
    shouldRunAI = true;
    logger.info(`AI forced via aiMode=always for ${barcode}`);
  } else if (aiMode === "never") {
    shouldRunAI = false;
    logger.info(`AI skipped via aiMode=never for ${barcode}`);
  } else {
    // "auto" mode - use intelligent detection
    shouldRunAI = needsAI;
  }

  let aiEnriched: any = {};
  let dataSource = "off-only";
  let lastEnriched = null;
  let aiInsight: string | null = null;
  let halalReason: string | null = null;

  // 6. AI enrichment (conditional)
  if (shouldRunAI) {
    logger.info(`AI enrichment running for barcode: ${barcode}`);
    try {
      const apiKey = getAPIKey(userApiKey, env.AI_MODEL);
      aiEnriched = await enrichMissingFields(
        extractedData,
        gaps,
        apiKey,
        barcode
      );

      // Merge AI-enriched fields
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

      if (aiEnriched.aiInsight) aiInsight = aiEnriched.aiInsight;
      if (aiEnriched.halalReason) halalReason = aiEnriched.halalReason;

      dataSource = gaps.completeness < 40 ? "ai-heavy" : "off+ai";
      lastEnriched = new Date();
    } catch (error) {
      logger.error(`AI enrichment failed: ${(error as Error).message}`);
      // Continue with OFF-only data
    }
  } else {
    logger.info(
      `AI enrichment not needed for barcode: ${barcode} (completeness: ${gaps.completeness}%)`
    );
  }

  // 7. Generate overview
  const overview =
    aiEnriched.overview || generateBasicOverview(offData.product);

  // 8. Set cache expiry (30-day TTL)
  const cacheExpiresAt = new Date();
  cacheExpiresAt.setDate(cacheExpiresAt.getDate() + 30);

  // 9. Prepare final data
  const finalData = {
    ...extractedData,
    dietaryStatus,
    halalStatus,
    halalReason,
    overview,
    aiInsight,
    dataCompleteness: gaps.completeness,
    dataSource,
    lastEnriched,
    offLastModified: offData.product.last_modified_t
      ? new Date(offData.product.last_modified_t * 1000)
      : null,
    cacheExpiresAt,
  };

  // 10. Persist to database
  const [newProduct] = await db
    .insert(products)
    .values({ barcode, ...finalData })
    .returning();

  logger.info(
    `Product ${barcode} saved with ${dataSource} source, ${gaps.completeness}% complete`
  );

  return newProduct;
}