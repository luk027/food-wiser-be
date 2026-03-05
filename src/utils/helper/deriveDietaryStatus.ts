export function deriveDietaryStatus(analysis: {
  vegan?: boolean | null;
  vegetarian?: boolean | null;
  palmOil?: boolean | null;
}): "vegan" | "veg" | "non-veg" | "unknown" {
  if (analysis.vegan === true) return "vegan";
  if (analysis.vegetarian === true) return "veg";
  if (analysis.vegan === false || analysis.vegetarian === false) return "non-veg";
  return "unknown";
}
