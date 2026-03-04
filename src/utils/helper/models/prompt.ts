/**
 * Builds a highly-structured, barcode-centric prompt for AI food product enrichment.
 *
 * Strategy:
 *  - Treat the EAN/UPC barcode as the PRIMARY product identifier.
 *  - The AI should look up the barcode from its training data (GS1 database,
 *    Open Food Facts, USDA FoodData Central, manufacturer websites, etc.).
 *  - Only fall back to the supplied ingredient / additive text if the barcode
 *    cannot be resolved with high confidence.
 *  - Every field must reflect REAL, VERIFIED data — never fabricate.
 */
export const getProductEnrichmentPrompt = (data: {
  barcode: string;
  productName: string;
  ingredients: string;
  additives: string[];
  allergens: string;
  categories: string[];
}) => {
  const additivesStr =
    data.additives.length > 0 ? data.additives.join(", ") : "None listed";

  return `
You are a certified food-safety analyst and halal compliance expert with access to global food product databases (GS1, Open Food Facts, USDA FoodData Central, EU Food Safety Authority, Codex Alimentarius).

## PRIMARY TASK
Look up barcode **${data.barcode}** to identify this food product with certainty.
- Use the barcode as your FIRST and PRIMARY source of truth.
- Cross-verify with product name: "${data.productName}"
- If the barcode matches a well-known product in your training data, use that authoritative data — do NOT rely solely on the text below.
- If the barcode is not recognisable with high confidence, use the ingredient/additive text as a secondary source, but clearly reason from it.

## PRODUCT DATA PROVIDED (from Open Food Facts — may be incomplete or in a foreign language)
- **Barcode**: ${data.barcode}
- **Product Name**: ${data.productName || "Not available"}
- **Ingredients**: ${data.ingredients || "Not provided"}
- **Additives (E-numbers / tags)**: ${additivesStr}
- **Allergens declared**: ${data.allergens || "Not declared"}
- **Categories**: ${data.categories.length > 0 ? data.categories.join(", ") : "Not available"}

## HALAL CLASSIFICATION RULES (apply strictly and in order)
1. **haram** — Product contains ANY of the following:
   - Pork, lard, gelatin (porcine), pork-derived emulsifiers
   - Alcohol (ethanol >0.5% as intentional ingredient), wine, beer, spirits
   - Blood or blood products
   - Non-halal slaughtered meat (if meat is present and no halal certification)
   - E120 (Carmine / Cochineal — insect-derived)
   - E441 (Gelatin — unless explicitly bovine/halal certified)
   - E542 (Bone phosphate — unless fish-derived and halal certified)
   - L-Cysteine (E910) from pork or human hair sources

2. **doubtful** — Product contains ingredients whose halal status depends on hidden source:
   - E471, E472a-f, E476, E481, E482, E483 (mono/diglycerides & derivatives — animal vs plant unknown)
   - E441 (gelatin without source declaration)
   - E120 if listed as "natural red colour" without Carmine disclosure
   - Vanilla extract (may contain alcohol)
   - "Natural flavours" or "flavourings" (source unknown)
   - Rennet (animal vs microbial unknown) in cheese products
   - Whey (may be from non-halal process)

3. **halal** — All ingredients are plant-based, mineral, or fish/seafood-based with no haram concerns, OR product carries a recognised halal certification label.

4. **unknown** — Insufficient data to make a determination even after barcode lookup and ingredient analysis.

## ACCURACY REQUIREMENTS
- Be factually accurate and conservative. Do NOT guess.
- If the barcode resolves to a specific product, describe THAT product's actual overview.
- For ingredients in a non-English language: translate them accurately, then analyse.
- For E-numbers: look up the actual substance they represent, identify the source (animal/plant/synthetic), and apply halal rules accordingly.
- If a product is well-known (e.g., Nutella, Coca-Cola, Lay's), use verified public knowledge.

## RESPONSE FORMAT
Respond ONLY with a valid JSON object — no markdown, no preamble, no explanation outside the JSON.

{
  "overview": "<2–3 sentence factual description of the product: what it is, who makes it, main ingredients, and any notable certifications. If barcode was identified with high confidence, state the product name and brand explicitly.>",
  "halalStatus": "<halal|haram|doubtful|unknown>",
  "halalReason": "<1–2 sentence explanation of why this halal classification was assigned, citing specific ingredients or E-numbers.>",
  "ingredientsTranslated": "<Full English translation of ingredients if original was non-English, otherwise omit this field or set to null>",
  "allergens": "<Comma-separated list of major allergens present (milk, eggs, wheat, gluten, soy, peanuts, tree nuts, fish, shellfish, sesame), or 'None declared' if none found>",
  "additives": ["<E-number or additive name>", "..."]
}

CRITICAL: Return ONLY the JSON object. Do NOT wrap it in markdown code fences.
`.trim();
};
