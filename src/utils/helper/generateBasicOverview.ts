export function generateBasicOverview(product: any): string {
  const parts = [];

  if (product.product_name || product.name) {
    parts.push(product.product_name || product.name);
  }

  if (product.brands || product.brand) {
    parts.push(`by ${product.brands || product.brand}`);
  }

  if (product.quantity) {
    parts.push(`(${product.quantity})`);
  }

  // Add what we DO know
  if (product.categories_tags?.length > 0) {
    const category = product.categories_tags[0]
      .replace(/^en:/i, "")
      .replace(/-/g, " ");
    parts.push(`- ${category}`);
  }

  if (product.nutriscore_grade) {
    parts.push(`Nutri-Score: ${product.nutriscore_grade.toUpperCase()}`);
  } else {
    // Add nutrition highlights if available
    const nutrients = product.nutriments;
    if (nutrients?.sugars_100g) {
      parts.push(`${nutrients.sugars_100g}g sugar per 100ml`);
    }
  }

  // Note limitations
  const missing = [];
  if (!product.ingredients_text) missing.push("ingredients");
  if (!product.nutriscore_grade) missing.push("nutrition score");

  if (missing.length > 0) {
    parts.push(
      `(limited data: ${missing.join(", ")} not available in database)`,
    );
  }

  return parts.length > 0 ? parts.join(" ") : "Product information limited.";
}
