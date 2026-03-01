export const getProductEnrichmentPrompt = (rawProductData: any) => {
  return `
    Act as a professional Food Scientist and Shariah Food Auditor. 
    Analyze the provided raw JSON data from Open Food Facts.

    ### DECISION LOGIC:
    1. **Dietary Status**: 'vegan', 'veg', or 'non-veg'.
    2. **Halal Status**: 'halal', 'haram', or 'doubtful' (Flag E471, E472, Gelatin, Carmine as doubtful/haram).
    3. **Scoring**: Provide 'nutriScore' and 'ecoScore' (A-E) if not in raw data by analyzing ingredients/nutrition.

    ### OUTPUT REQUIREMENTS:
    - Return ONLY a minified JSON object.
    - Match the REQUIRED STRUCTURE exactly.
    - Use "N/A" for missing strings and 0 for missing numbers.

    ### REQUIRED STRUCTURE (Match these keys exactly):
    {
      "name": "string",
      "brand": "string",
      "overview": "string",
      "quantity": "string",
      "imageUrl": "string",
      "ingredients": "string",
      "allergens": "string",
      "additives": "string",
      "nutriScore": "string",
      "ecoScore": "string",
      "dietaryStatus": "string",
      "halalStatus": "string",
      "nutritionInfo": { 
        "calories": number, 
        "fat": number, 
        "sugar": number, 
        "protein": number 
      },
      "countryOfOrigin": "string",
      "packaging": "string"
    }

    ### RAW DATA:
    ${JSON.stringify(rawProductData)}
  `;
};