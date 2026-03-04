export function deriveDietaryStatus(analysis: {
  vegan?: boolean;
  vegetarian?: boolean;
  nonVegan?: boolean;
}): "vegan" | "veg" | "non-veg" | "unknown" {
  if (analysis.vegan) return "vegan";
  if (analysis.vegetarian && !analysis.nonVegan) return "veg";
  if (analysis.nonVegan) return "non-veg";
  return "unknown";
}
