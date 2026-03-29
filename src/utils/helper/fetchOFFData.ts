
// Fetch data from Open Food Facts API
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
  if (data.status !== 1 || !data.product) {
    return null;
  }
  return data;
}
