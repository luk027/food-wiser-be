import type { Context } from "hono";
import { ProductService } from "@/services";
import { TryCatch } from "@utils/tryCatch.util";
import { createResponse } from "@utils/response.util";
import { scanProductSchema } from "@/validations/product.validations";

export const scanProduct = TryCatch(async (c: Context) => {
  const barcodeParam = c.req.param("barcode");
  const apiKeyHeader = c.req.header("x-api-key");

  const data = scanProductSchema.parse({
    barcode: barcodeParam,
    userApiKey: apiKeyHeader,
  });

  const { barcode, userApiKey } = data;
  const result = await ProductService.getProductData({ barcode, userApiKey });

  return c.json(
    createResponse(true, "Product scanned successfully", 200, result),
  );
});
