import { eq } from "drizzle-orm";
import { db } from "@db/connection";
import { products } from "@db/schema/product";
import { logger } from "@utils/logger.util";
import { env } from "@config/env.ts";
import { enrichWithGemini } from "@/utils/helper/enhanceWithGemini";
import { fetchOFFData } from "@/utils/helper/fetchOFFData";

export async function getProductData({
  barcode,
  userApiKey,
}: {
  barcode: string;
  userApiKey?: string;
}) {
  // 1. Cache Lookup
  const [cachedProduct] = await db
    .select()
    .from(products)
    .where(eq(products.barcode, barcode))
    .limit(1);

  if (cachedProduct) return cachedProduct;

  // 2. Fetch raw data
  const offData = await fetchOFFData(barcode);
  let finalData;

  // 3. AI Enrichment
  try {
    const apiKey = userApiKey || env.GEMINI_API_KEY;
    // We pass the raw data and let Gemini map it to our schema
    finalData = await enrichWithGemini(offData.product, apiKey);
  } catch (error) {
    logger.error(`⚠️ Gemini Failed: ${(error as Error).message}`);
    // Fallback must also match schema keys
    finalData = {
      name: offData.product?.product_name || "Unknown",
      brand: offData.product?.brands || "Unknown",
      overview: "Details from OFF (Enrichment failed)",
      quantity: offData.product?.quantity || "N/A",
      imageUrl: offData.product?.image_url || null,
      ingredients: offData.product?.ingredients_text || "N/A",
      allergens: offData.product?.allergens || "N/A",
      additives: offData.product?.additives_tags?.join(", ") || "N/A",
      nutriScore: offData.product?.nutriscore_grade || "N/A",
      ecoScore: offData.product?.ecoscore_grade || "N/A",
      dietaryStatus: "unknown",
      halalStatus: "unknown",
      nutritionInfo: {},
      countryOfOrigin: offData.product?.countries || "N/A",
      packaging: offData.product?.packaging || "N/A"
    };
  }

  // 4. Persistence
  // Because finalData keys now match schema keys exactly, we just spread it
  const [newProduct] = await db
    .insert(products)
    .values({
      barcode,
      ...finalData,
    })
    .returning();

  return newProduct;
}
