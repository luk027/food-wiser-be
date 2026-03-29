import { db } from "@db/connection";
import { additiveClassifications, haramKeywords } from "@db/schema";
import { eq, or } from "drizzle-orm";
import { logger } from "@utils/logger.util";

/**
 * Halal classification result including a human-readable reason.
 */
export interface HalalClassificationResult {
  status: "halal" | "haram" | "doubtful" | "unknown";
  reason: string;
}

// ---------------------------------------------------------------------------
// OFF label_tags that indicate explicit halal certification on the product
// ---------------------------------------------------------------------------
const HALAL_LABEL_TAGS = [
  "en:halal",
  "fr:halal",
  "fr:certifie-halal",
  "en:halal-certified",
  "en:halal-food",
  "en:halal-slaughtered",
  "en:ifanca-halal-certified",
  "en:halal-australia",
  "en:halal-malaysia",
  "en:halal-indonesia",
  "en:halal-turkey",
  "en:jakim-halal",
  "en:muis-halal",
  "en:hfce-halal",
];

// ---------------------------------------------------------------------------
// OFF label_tags that confirm non-halal / alcohol content
// ---------------------------------------------------------------------------
const HARAM_LABEL_TAGS = [
  "en:contains-pork",
  "en:pork",
  "en:alcohol",
  "en:contains-alcohol",
  "en:wine",
  "en:beer",
];

// ---------------------------------------------------------------------------
// Fallback in-memory keyword lists used when the DB is unavailable.
// These are used as a SAFETY NET only; the DB is the authoritative source.
// ---------------------------------------------------------------------------
const FALLBACK_HARAM_KEYWORDS: Record<string, "haram" | "doubtful"> = {
  // Pork
  pork: "haram",
  "pork fat": "haram",
  "pork rind": "haram",
  "pork lard": "haram",
  bacon: "haram",
  ham: "haram",
  pancetta: "haram",
  prosciutto: "haram",
  salami: "haram",
  pepperoni: "haram",
  chorizo: "haram",
  lard: "haram",
  "pork gelatin": "haram",
  "pig fat": "haram",
  "pig skin": "haram",
  swine: "haram",
  porcine: "haram",
  "pork extract": "haram",
  // Alcohol
  alcohol: "haram",
  ethanol: "haram",
  wine: "haram",
  beer: "haram",
  rum: "haram",
  vodka: "haram",
  whisky: "haram",
  whiskey: "haram",
  brandy: "haram",
  liqueur: "haram",
  champagne: "haram",
  mead: "haram",
  sake: "haram",
  tequila: "haram",
  gin: "haram",
  schnapps: "haram",
  "wine vinegar": "haram",
  "malt vinegar": "haram",           // contains trace alcohol (haram by many scholars)
  "sherry vinegar": "haram",
  "red wine": "haram",
  "white wine": "haram",
  "rice wine": "haram",
  "cooking wine": "haram",
  "vanilla extract": "haram",        // alcohol-based extract
  // Blood / carrion
  blood: "haram",
  "blood plasma": "haram",
  "dried blood": "haram",
  // Doubtful
  gelatin: "doubtful",
  gelatine: "doubtful",
  rennet: "doubtful",
  "animal rennet": "haram",
  pepsin: "doubtful",
  tallow: "doubtful",
  "animal fat": "doubtful",
  "animal shortening": "doubtful",
  "beef extract": "doubtful",
  "chicken fat": "doubtful",
  "natural flavor": "doubtful",
  "natural flavour": "doubtful",
  "natural flavors": "doubtful",
  "natural flavours": "doubtful",
  carmine: "haram",                  // insect-derived (majority of scholars)
  cochineal: "haram",
  "e120": "haram",
  "l-cysteine": "doubtful",         // often animal-derived
  lactoferrin: "doubtful",
  shellac: "doubtful",              // insect secretion
  "e904": "doubtful",
};

// ---------------------------------------------------------------------------
// Normalise additive codes that might come in with different formats
// e.g. "en:e471" → "E471", "e471" → "E471"
// ---------------------------------------------------------------------------
function normaliseAdditiveCode(raw: string): string {
  return raw
    .replace(/^en:/i, "")
    .toUpperCase()
    .trim();
}

// ---------------------------------------------------------------------------
// Word-boundary aware substring check.
// Prevents "ham" from matching "mushroom", "wine" from matching "swine", etc.
// ---------------------------------------------------------------------------
function containsWord(text: string, word: string): boolean {
  // For multi-word phrases we do a simple substring search (already specific enough)
  if (word.includes(" ")) {
    return text.includes(word);
  }
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
  return re.test(text);
}

// ---------------------------------------------------------------------------
// Checks the OFF labels_tags array for explicit halal / haram certification
// ---------------------------------------------------------------------------
function checkLabelTags(labelsTags: string[] | null): "halal" | "haram" | null {
  if (!labelsTags || labelsTags.length === 0) return null;
  const lower = labelsTags.map((t) => t.toLowerCase());
  if (HARAM_LABEL_TAGS.some((tag) => lower.includes(tag))) return "haram";
  if (HALAL_LABEL_TAGS.some((tag) => lower.includes(tag))) return "halal";
  return null;
}

// ---------------------------------------------------------------------------
// Main classifier
// ---------------------------------------------------------------------------
export async function classifyHalalStatus(
  ingredients: string | null,
  additives: string[],
  labelsTags?: string[] | null,
): Promise<HalalClassificationResult> {

  // ── 0. No data at all ──────────────────────────────────────────────────
  if (!ingredients && additives.length === 0 && (!labelsTags || labelsTags.length === 0)) {
    return { status: "unknown", reason: "No ingredient or label data available to determine halal status." };
  }

  const ingredientsLower = (ingredients || "").toLowerCase();

  // ── 1. Check OFF label tags for explicit certification ─────────────────
  const labelResult = checkLabelTags(labelsTags ?? null);
  if (labelResult === "halal") {
    return {
      status: "halal",
      reason: "Product carries an explicit Halal certification label.",
    };
  }
  if (labelResult === "haram") {
    const tag = (labelsTags ?? []).find((t) =>
      HARAM_LABEL_TAGS.includes(t.toLowerCase()),
    );
    return {
      status: "haram",
      reason: `Product is labeled as non-halal (${tag ?? "haram label"}).`,
    };
  }

  // ── 2. Check haram keywords in ingredients text (DB) ──────────────────
  try {
    const keywords = await db.select().from(haramKeywords);

    for (const kw of keywords) {
      if (containsWord(ingredientsLower, kw.keyword)) {
        if (kw.status === "haram") {
          logger.info(`Haram keyword detected: "${kw.keyword}"`);
          return {
            status: "haram",
            reason: `Contains haram ingredient: "${kw.keyword}"${kw.notes ? ` (${kw.notes})` : ""}.`,
          };
        }
        if (kw.status === "doubtful") {
          logger.info(`Doubtful keyword detected: "${kw.keyword}"`);
          return {
            status: "doubtful",
            reason: `Contains doubtful ingredient: "${kw.keyword}"${kw.notes ? ` — ${kw.notes}` : ". Source origin unclear — treat with caution."}.`,
          };
        }
      }
    }
  } catch (error) {
    // DB failed → fall back to in-memory list
    logger.warn(`DB keyword check failed, using fallback list: ${(error as Error).message}`);
    for (const [word, status] of Object.entries(FALLBACK_HARAM_KEYWORDS)) {
      if (containsWord(ingredientsLower, word)) {
        return {
          status,
          reason: `Contains ${status} ingredient: "${word}" (fallback classification).`,
        };
      }
    }
  }

  // ── 3. Check additives against DB ─────────────────────────────────────
  if (additives.length > 0) {
    try {
      const additiveCodes = additives.map(normaliseAdditiveCode);

      const additivesData = await db
        .select()
        .from(additiveClassifications)
        .where(
          or(
            ...additiveCodes.map((code) =>
              eq(additiveClassifications.code, code),
            ),
          ),
        );

      // Haram additive → haram
      const haramAdditive = additivesData.find((a) => a.halalStatus === "haram");
      if (haramAdditive) {
        logger.info(`Haram additive detected: ${haramAdditive.code}`);
        return {
          status: "haram",
          reason: `Contains haram additive ${haramAdditive.code} (${haramAdditive.name})${haramAdditive.notes ? `: ${haramAdditive.notes}` : ""}.`,
        };
      }

      // Doubtful additive → doubtful
      const doubtfulAdditive = additivesData.find((a) => a.halalStatus === "doubtful");
      if (doubtfulAdditive) {
        logger.info(`Doubtful additive detected: ${doubtfulAdditive.code}`);
        return {
          status: "doubtful",
          reason: `Contains doubtful additive ${doubtfulAdditive.code} (${doubtfulAdditive.name})${doubtfulAdditive.notes ? ` — ${doubtfulAdditive.notes}` : "; source requires verification"}.`,
        };
      }

      // Unclassified additives → unknown
      const unclassifiedCodes = additiveCodes.filter(
        (code) => !additivesData.some((a) => a.code === code),
      );
      if (unclassifiedCodes.length > 0) {
        logger.info(`Unclassified additives: ${unclassifiedCodes.join(", ")}`);
        return {
          status: "unknown",
          reason: `Contains additives with unknown halal status: ${unclassifiedCodes.join(", ")}. Cannot determine halal classification without source information.`,
        };
      }
    } catch (error) {
      logger.warn(`Additive DB check failed: ${(error as Error).message}`);
      return {
        status: "unknown",
        reason: "Additive classification database unavailable. Halal status could not be determined.",
      };
    }
  }

  // ── 4. All checks passed ───────────────────────────────────────────────
  if (!ingredients && additives.length === 0) {
    return {
      status: "unknown",
      reason: "No ingredient data available. Cannot confirm halal status.",
    };
  }

  return {
    status: "halal",
    reason: "No haram or doubtful ingredients detected based on ingredient text and additive analysis.",
  };
}
