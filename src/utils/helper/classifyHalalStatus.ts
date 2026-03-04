import { db } from "@db/connection";
import { additiveClassifications, haramKeywords } from "@db/schema";
import { eq, or } from "drizzle-orm";
import { logger } from "@utils/logger.util";

export async function classifyHalalStatus(
  ingredients: string | null,
  additives: string[],
): Promise<"halal" | "haram" | "doubtful" | "unknown"> {
  if (!ingredients && additives.length === 0) {
    return "unknown";
  }

  const ingredientsLower = (ingredients || "").toLowerCase();

  // 1. Check for haram keywords in ingredients text
  try {
    const keywords = await db.select().from(haramKeywords);

    for (const kw of keywords) {
      if (ingredientsLower.includes(kw.keyword)) {
        if (kw.status === "haram") {
          logger.info(`Haram keyword detected: ${kw.keyword}`);
          return "haram";
        }
        if (kw.status === "doubtful") {
          logger.info(`Doubtful keyword detected: ${kw.keyword}`);
          return "doubtful";
        }
      }
    }
  } catch (error) {
    logger.warn(`Keyword check failed: ${(error as Error).message}`);
  }

  // 2. Check additives against database
  if (additives.length > 0) {
    try {
      const additiveCodes = additives.map((a) =>
        typeof a === "string" ? a : (a as any).code || a,
      );

      const additivesData = await db
        .select()
        .from(additiveClassifications)
        .where(
          or(
            ...additiveCodes.map((code) =>
              eq(
                additiveClassifications.code,
                code.toUpperCase().replace(/^en:/i, ""),
              ),
            ),
          ),
        );

      // If any additive is haram → product is haram
      if (additivesData.some((a) => a.halalStatus === "haram")) {
        logger.info(`Haram additive detected`);
        return "haram";
      }

      // If any additive is doubtful → product is doubtful
      if (additivesData.some((a) => a.halalStatus === "doubtful")) {
        logger.info(`Doubtful additive detected`);
        return "doubtful";
      }

      // If we have unclassified additives → unknown
      if (additivesData.length < additiveCodes.length) {
        logger.info(`Unclassified additives present`);
        return "unknown";
      }
    } catch (error) {
      logger.warn(`Additive check failed: ${(error as Error).message}`);
      return "unknown";
    }
  }

  // 3. All checks passed → halal
  return "halal";
}
