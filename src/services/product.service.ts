import { eq } from "drizzle-orm";
import { db } from "@db/connection";
import { products } from "@db/schema/product";
import { logger } from "@utils/logger.util";
import { fetchOFFData } from "@/utils/helper/fetchOFFData";
import { mapOFFToProduct } from "@/utils/helper/mapOFFToProduct";
import { deriveDietaryStatus } from "@/utils/helper/deriveDietaryStatus";
import { classifyHalalStatus } from "@/utils/helper/classifyHalalStatus";

export async function getProductData({ barcode }: { barcode: string }) {
  // [1] DB cache lookup
  const [cachedProduct] = await db
    .select()
    .from(products)
    .where(eq(products.barcode, barcode))
    .limit(1);

  if (cachedProduct) {
    if (
      cachedProduct.cacheExpiresAt &&
      new Date() > cachedProduct.cacheExpiresAt
    ) {
      logger.info(`Cache expired for ${barcode}, deleting and re-fetching`);
      await db.delete(products).where(eq(products.barcode, barcode));
    } else {
      logger.info(`Cache hit for barcode: ${barcode}`);
      return cachedProduct;
    }
  }

  // [2] Fetch from OFF
  const offResult = await fetchOFFData(barcode);
  if (!offResult || !offResult.product) {
    logger.info(`Product ${barcode} not found on OFF`);
    return null;
  }

  // [3] Map OFF data to DB structure
  const mapped = mapOFFToProduct(barcode, offResult.product);

  // [4] Classify dietary + halal status
  const dietaryStatus = deriveDietaryStatus(mapped.ingredientsAnalysis);
  const halalResult = await classifyHalalStatus(
    mapped.ingredients || "",      // ingredient text from OFF
    mapped.additives || [],        // additive code array from OFF
    mapped.labelsTags || [],       // label tags for halal certification check
  );

  // [5] Persist to DB + return
  const cacheExpiresAt = new Date();
  cacheExpiresAt.setDate(cacheExpiresAt.getDate() + 30);

  // Strip labelsTags from the saved object (not a DB column)
  const { labelsTags: _discard, ...mappedWithoutLabels } = mapped;

  const productToSave = {
    ...mappedWithoutLabels,
    dietaryStatus,
    halalStatus: halalResult.status,
    halalReason: halalResult.reason,
    dataSource: "off-only",
    lastEnriched: new Date(),
    cacheExpiresAt,
  };

  // Using upsert (insert or update)
  const [newProduct] = await db
    .insert(products)
    .values({ ...productToSave, barcode })
    .onConflictDoUpdate({
      target: products.barcode,
      set: productToSave,
    })
    .returning();

  logger.info(`Product ${barcode} fetched from OFF and saved to DB`);
  return newProduct;
}