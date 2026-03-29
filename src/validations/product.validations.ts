import z from "zod";

export const scanProductSchema = z.object({
  barcode: z
    .string()
    .regex(/^\d{8,14}$/, "Barcode must be between 8 and 14 numeric digits"),
});
