export function mapOFFToProduct(barcode: string, off: any) {
  const nutriments = off.nutriments || {};

  const name =
    off.product_name ||
    off.product_name_en ||
    off.abbreviated_product_name ||
    null;
  const brand = off.brands || null;
  const quantity = off.quantity || null;
  const imageUrl = off.image_front_url || off.image_url || null;

  const ingredients = off.ingredients_text_en || off.ingredients_text || null;
  const allergens = off.allergens_from_ingredients || off.allergens || null;
  const additives = (off.additives_tags || []).map((tag: string) =>
    tag.replace(/^en:/, "").toUpperCase(),
  );

  const analysisTags = off.ingredients_analysis_tags || [];
  const ingredientsAnalysis = {
    vegan: analysisTags.includes("en:vegan")
      ? true
      : analysisTags.includes("en:non-vegan")
        ? false
        : null,
    vegetarian: analysisTags.includes("en:vegetarian")
      ? true
      : analysisTags.includes("en:non-vegetarian")
        ? false
        : null,
    palmOil: analysisTags.includes("en:palm-oil")
      ? true
      : analysisTags.includes("en:palm-oil-free")
        ? false
        : null,
  };

  const nutriScore = off.nutriscore_grade || null;
  const ecoScore = off.ecoscore_grade || null;
  const novaGroup = off.nova_group?.toString() || null;
  const nutrientLevels = off.nutrient_levels || null;

  const nutritionInfo = {
    energyKcal: nutriments["energy-kcal_100g"] ?? null,
    fat: nutriments["fat_100g"] ?? null,
    saturatedFat: nutriments["saturated-fat_100g"] ?? null,
    carbohydrates: nutriments["carbohydrates_100g"] ?? null,
    sugars: nutriments["sugars_100g"] ?? null,
    fiber: nutriments["fiber_100g"] ?? null,
    proteins: nutriments["proteins_100g"] ?? null,
    salt: nutriments["salt_100g"] ?? null,
  };

  const countryOfOrigin = off.countries || off.manufacturing_places || null;
  const packaging = off.packaging || null;
  // labels_tags includes certifications like "en:halal", "en:vegan", "en:organic", etc.
  const labels = off.labels_tags || null;
  // Pass raw labels_tags for halal certification check (e.g. "en:halal", "en:halal-certified")
  const labelsTags: string[] = off.labels_tags || [];

  const offLastModified = off.last_modified_t
    ? new Date(off.last_modified_t * 1000)
    : null;

  // Data completeness calculation
  const fieldsToCheck = [
    name,
    brand,
    ingredients,
    allergens,
    nutriScore,
    nutritionInfo.energyKcal,
    novaGroup,
  ];
  const filledCount = fieldsToCheck.filter(
    (field) => field !== null && field !== undefined && field !== "",
  ).length;
  const dataCompleteness = Math.round((filledCount / fieldsToCheck.length) * 100);

  return {
    barcode,
    name,
    brand,
    quantity,
    imageUrl,
    ingredients,
    allergens,
    additives,
    ingredientsAnalysis,
    nutriScore,
    ecoScore,
    novaGroup,
    nutrientLevels,
    nutritionInfo,
    countryOfOrigin,
    packaging,
    labels,
    labelsTags,      // raw OFF labels_tags used for halal certification detection
    offLastModified,
    dataCompleteness,
  };
}
