import type { Context } from "hono";
import { ProductService } from "@/services";
import { TryCatch } from "@utils/tryCatch.util";
import { createResponse } from "@utils/response.util";
import { scanProductSchema } from "@/validations/product.validations";
import { computeCalorieBreakdown } from "@utils/helper/computeCalorieBreakdown";

export const scanProduct = TryCatch(async (c: Context) => {
  const { barcode } = scanProductSchema.parse({
    barcode: c.req.param("barcode"),
  });

  const result = await ProductService.getProductData({ barcode });

  if (!result) {
    return c.json(
      createResponse(true, "Food product data not available", 200, null),
    );
  }

  const calorieBreakdown = computeCalorieBreakdown(
    result.nutritionInfo as Record<string, number | null> | null,
  );

  return c.json(
    createResponse(true, "Product scanned successfully", 200, {
      ...result,
      calorieBreakdown,
    }),
  );
});
