function getMultiLangField(
  product: any,
  fieldBase: string,
  preferredLangs = ["en", "fr", "de", "it", "es", "nl", "ar"],
): string | null {
  // Try English first
  if (product[`${fieldBase}_en`]) return product[`${fieldBase}_en`];

  // Try base field
  if (product[fieldBase]) return product[fieldBase];

  // Try other languages in order
  for (const lang of preferredLangs) {
    const value = product[`${fieldBase}_${lang}`];
    if (value) return value;
  }

  return null;
}

export function extractOFFData(offProduct: any) {
  return {
    // Basic info with language fallback
    name: getMultiLangField(offProduct, "product_name") || "Unknown Product",
    brand: offProduct.brands || "Unknown Brand",
    quantity: offProduct.quantity || null,
    imageUrl: offProduct.image_url || offProduct.image_front_url || null,

    // Ingredients with language fallback
    ingredients: getMultiLangField(offProduct, "ingredients_text"),
    ingredientsAnalysis: {
      vegan:
        offProduct.ingredients_analysis_tags?.includes("en:vegan") || false,
      vegetarian:
        offProduct.ingredients_analysis_tags?.includes("en:vegetarian") ||
        false,
      palmOil:
        offProduct.ingredients_analysis_tags?.includes("en:palm-oil") || false,
      nonVegan:
        offProduct.ingredients_analysis_tags?.includes("en:non-vegan") || false,
    },
    allergens: offProduct.allergens || null,
    additives: offProduct.additives_tags || [],

    // Nutrition (numeric, less language-dependent)
    nutriScore: offProduct.nutriscore_grade?.toUpperCase() || null,
    ecoScore: offProduct.ecoscore_grade?.toUpperCase() || null,
    novaGroup: offProduct.nova_group?.toString() || null,
    nutrientLevels: offProduct.nutrient_levels
      ? {
          fat: offProduct.nutrient_levels.fat || "unknown",
          salt: offProduct.nutrient_levels.salt || "unknown",
          sugar: offProduct.nutrient_levels.sugars || "unknown",
          saturatedFat:
            offProduct.nutrient_levels["saturated-fat"] || "unknown",
        }
      : null,
    nutritionInfo: {
      calories: offProduct.nutriments?.["energy-kcal_100g"] || null,
      fat: offProduct.nutriments?.fat_100g || null,
      saturatedFat: offProduct.nutriments?.["saturated-fat_100g"] || null,
      sugar: offProduct.nutriments?.sugars_100g || null,
      protein: offProduct.nutriments?.proteins_100g || null,
      salt: offProduct.nutriments?.salt_100g || null,
      fiber: offProduct.nutriments?.fiber_100g || null,
      carbohydrates: offProduct.nutriments?.carbohydrates_100g || null,
    },

    countryOfOrigin: offProduct.countries || null,
    packaging: offProduct.packaging || null,
    labels: offProduct.labels_tags || [],
  };
}
