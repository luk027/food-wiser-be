export interface AIEnricher {
  enrich(
    minimalData: {
      barcode: string;
      productName: string;
      ingredients: string;
      additives: string[];
      allergens: string;
      categories: string[];
    },
    apiKey: string,
  ): Promise<any>;
}

export type AIModelType = "gemini" | "groq";
