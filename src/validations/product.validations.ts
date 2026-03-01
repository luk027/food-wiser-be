import z from "zod";

export const scanProductSchema = z.object({
  barcode: z
    .string()
    .regex(/^\d{8,14}$/, "Barcode must be between 8 and 14 numeric digits"),
  userApiKey: z.string().optional(),
});

export const geminiResponseSchema = z.object({
  name: z.string().min(1).default("Unknown Product"),
  brand: z.string().default("Unknown Brand"),
  overview: z.string().default("N/A"),
  quantity: z.string().default("N/A"),
  imageUrl: z.string().url().nullable().or(z.string().length(0)).default(null),
  ingredients: z.string().default("N/A"),
  allergens: z.string().default("N/A"),
  additives: z.string().default("N/A"),
  nutriScore: z.string().max(10).default("N/A"),
  ecoScore: z.string().max(10).default("N/A"),
  dietaryStatus: z.enum(["veg", "vegan", "non-veg", "unknown"]).default("unknown"),
  halalStatus: z.enum(["halal", "haram", "doubtful", "unknown"]).default("unknown"),
  nutritionInfo: z.object({
    calories: z.number().default(0),
    fat: z.number().default(0),
    sugar: z.number().default(0),
    protein: z.number().default(0),
  }).default({}),
  countryOfOrigin: z.string().default("N/A"),
  packaging: z.string().default("N/A"),
});