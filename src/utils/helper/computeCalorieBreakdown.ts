/**
 * Atwater energy conversion factors (kcal per gram)
 *   Fat          → 9 kcal/g
 *   Carbohydrates → 4 kcal/g
 *   Protein       → 4 kcal/g
 *
 * These are the internationally recognised values used by nutrition
 * labelling standards (EU 1169/2011, FDA, WHO).
 */
const KCAL_PER_G_FAT = 9;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_PROTEIN = 4;

export interface CalorieBreakdown {
  /** Total kcal per 100 g — taken directly from OFF (most accurate) */
  totalKcal: number | null;
  /** Kcal contributed by fat per 100 g */
  fatKcal: number | null;
  /** Kcal contributed by carbohydrates per 100 g */
  carbsKcal: number | null;
  /** Kcal contributed by protein per 100 g */
  proteinKcal: number | null;
  /** Fat as % of total calories (0–100, rounded to 1 dp) */
  fatPercent: number | null;
  /** Carbohydrates as % of total calories (0–100, rounded to 1 dp) */
  carbsPercent: number | null;
  /** Protein as % of total calories (0–100, rounded to 1 dp) */
  proteinPercent: number | null;
}

/**
 * Computes total calorie count and macronutrient percentage breakdown.
 *
 * @param nutritionInfo - The `nutritionInfo` object stored in the DB / mapped from OFF.
 *                        All values are per 100 g of product.
 * @returns A `CalorieBreakdown` object — any field is `null` when its
 *          source data is missing.
 */
export function computeCalorieBreakdown(
  nutritionInfo: Record<string, number | null> | null | undefined,
): CalorieBreakdown {
  const empty: CalorieBreakdown = {
    totalKcal: null,
    fatKcal: null,
    carbsKcal: null,
    proteinKcal: null,
    fatPercent: null,
    carbsPercent: null,
    proteinPercent: null,
  };

  if (!nutritionInfo) return empty;

  const totalKcal =
    typeof nutritionInfo.energyKcal === "number"
      ? Math.round(nutritionInfo.energyKcal)
      : null;

  const fat = typeof nutritionInfo.fat === "number" ? nutritionInfo.fat : null;
  const carbs =
    typeof nutritionInfo.carbohydrates === "number"
      ? nutritionInfo.carbohydrates
      : null;
  const protein =
    typeof nutritionInfo.proteins === "number"
      ? nutritionInfo.proteins
      : null;

  const fatKcal = fat !== null ? Math.round(fat * KCAL_PER_G_FAT) : null;
  const carbsKcal = carbs !== null ? Math.round(carbs * KCAL_PER_G_CARB) : null;
  const proteinKcal =
    protein !== null ? Math.round(protein * KCAL_PER_G_PROTEIN) : null;

  // Use the macronutrient-derived total as the denominator for percentages.
  // This gives a consistent percentage sum (≈ 100 %) even when the OFF
  // energyKcal value differs slightly due to fibre/alcohol/other factors.
  const macroTotal =
    fatKcal !== null && carbsKcal !== null && proteinKcal !== null
      ? fatKcal + carbsKcal + proteinKcal
      : null;

  const round1 = (v: number) => Math.round(v * 10) / 10;

  const fatPercent =
    macroTotal !== null && macroTotal > 0 && fatKcal !== null
      ? round1((fatKcal / macroTotal) * 100)
      : null;

  const carbsPercent =
    macroTotal !== null && macroTotal > 0 && carbsKcal !== null
      ? round1((carbsKcal / macroTotal) * 100)
      : null;

  const proteinPercent =
    macroTotal !== null && macroTotal > 0 && proteinKcal !== null
      ? round1((proteinKcal / macroTotal) * 100)
      : null;

  return {
    totalKcal,
    fatKcal,
    carbsKcal,
    proteinKcal,
    fatPercent,
    carbsPercent,
    proteinPercent,
  };
}
