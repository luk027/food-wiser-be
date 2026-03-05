import type { Context } from "hono";
import { ProductService } from "@/services";
import { TryCatch } from "@utils/tryCatch.util";
import { createResponse } from "@utils/response.util";
import { scanProductSchema } from "@/validations/product.validations";

export const scanProduct = TryCatch(async (c: Context) => {
  const barcodeParam = c.req.param("barcode");
  const apiKeyHeader = c.req.header("x-api-key");
  const rawAiMode = c.req.query("aiMode");
  const aiMode: "auto" | "always" | "never" =
    rawAiMode === "always" || rawAiMode === "never" ? rawAiMode : "auto";

  const data = scanProductSchema.parse({
    barcode: barcodeParam,
    userApiKey: apiKeyHeader,
  });

  const { barcode, userApiKey } = data;
  const result = await ProductService.getProductData({
    barcode,
    userApiKey,
    aiMode,
  });

  return c.json(
    createResponse(true, "Product scanned successfully", 200, result),
  );
});
