export interface DataGaps {
  missingCritical: string[];
  missingOptional: string[];
  needsTranslation: string[];
  completeness: number; // 0-100
}

export function checkDataCompleteness(data: any): DataGaps {
  const critical = ["name", "ingredients"];
  const optional = ["allergens", "additives", "nutriScore", "nutritionInfo"];

  const missingCritical: string[] = [];
  const missingOptional: string[] = [];
  const needsTranslation: string[] = [];

  // Check critical fields
  for (const field of critical) {
    if (
      !data[field] ||
      data[field] === "Unknown Product" ||
      data[field] === "N/A"
    ) {
      missingCritical.push(field);
    }
  }

  // Check optional fields
  for (const field of optional) {
    if (
      !data[field] ||
      (Array.isArray(data[field]) && data[field].length === 0) ||
      (typeof data[field] === "object" &&
        Object.values(data[field]).every((v) => v === null || v === 0))
    ) {
      missingOptional.push(field);
    }
  }

  // Check if ingredients are non-English (heuristic: high non-ASCII ratio)
  if (data.ingredients) {
    const nonAsciiRatio =
      (data.ingredients.match(/[^\x00-\x7F]/g) || []).length /
      data.ingredients.length;
    if (nonAsciiRatio > 0.3) {
      needsTranslation.push("ingredients");
    }
  }

  const totalFields = critical.length + optional.length;
  const missingFields = missingCritical.length + missingOptional.length;
  const completeness = Math.round(
    ((totalFields - missingFields) / totalFields) * 100,
  );

  return {
    missingCritical,
    missingOptional,
    needsTranslation,
    completeness,
  };
}
