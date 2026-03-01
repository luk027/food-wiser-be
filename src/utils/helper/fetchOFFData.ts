import { HTTPException } from "hono/http-exception";

// Fetch adat from Open Food Facts API
export async function fetchOFFData(barcode: string) {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    {
      headers: {
        "User-Agent": "FoodWiser - Bun/Hono - Version 1.0", // OFF prefers a User-Agent
      },
    },
  );

  const data: any = await response.json();
  if (data.status === 0) {
    throw new HTTPException(404, {
      message: "Product not found in OFF database",
    });
  }
  return data;
}
