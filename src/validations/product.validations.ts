import z from "zod";

export const scanProductSchema = z.object({
  barcode: z
    .string()
    .regex(/^\d{8,14}$/, "Barcode must be between 8 and 14 numeric digits"),
  userApiKey: z.string().optional(),
});

export const AIResponseSchema = z.object({
  overview: z.string().min(10).default("Product information available."),
  halalStatus: z
    .enum(["halal", "haram", "doubtful", "unknown"])
    .default("unknown"),
  // .nullish() accepts null | undefined from AI; transform normalises null → undefined
  halalReason: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  ingredientsTranslated: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  allergens: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  additives: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? undefined),
});
