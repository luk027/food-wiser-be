import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  index,
  integer,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    // PRIMARY KEY
    barcode: varchar("barcode", { length: 255 }).primaryKey(),

    // Basic Info (OFF direct)
    name: text("name").notNull(),
    brand: varchar("brand", { length: 255 }),
    quantity: varchar("quantity", { length: 100 }),
    imageUrl: text("image_url"),

    // Ingredients (OFF direct)
    ingredients: text("ingredients"),
    ingredientsAnalysis: jsonb("ingredients_analysis"), // {vegan, vegetarian, palmOil, nonVegan}
    allergens: text("allergens"),
    additives: jsonb("additives"), // Array of {code, name}

    // Nutrition (OFF direct)
    nutriScore: varchar("nutri_score", { length: 10 }),
    ecoScore: varchar("eco_score", { length: 10 }),
    novaGroup: varchar("nova_group", { length: 2 }), // 1-4 processing level
    nutrientLevels: jsonb("nutrient_levels"), // {fat, salt, sugar, saturatedFat}
    nutritionInfo: jsonb("nutrition_info"), // Full nutriments object with 8+ fields

    // Status (derived from OFF + minimal AI)
    dietaryStatus: varchar("dietary_status", { length: 50 }),
    halalStatus: varchar("halal_status", { length: 50 }),
    overview: text("overview"), // AI-generated or template-based summary

    // Meta (OFF direct)
    countryOfOrigin: varchar("country_of_origin", { length: 255 }),
    packaging: varchar("packaging", { length: 255 }),
    labels: jsonb("labels"), // Certifications array

    // Data Quality Tracking
    dataCompleteness: integer("data_completeness"), // 0-100 percentage
    dataSource: varchar("data_source", { length: 50 }), // "off-only|off+ai|ai-heavy"
    lastEnriched: timestamp("last_enriched"), // When AI was last used

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    brandIdx: index("brand_idx").on(table.brand),
    dietaryIdx: index("dietary_idx").on(table.dietaryStatus),
    halalIdx: index("halal_idx").on(table.halalStatus),
    novaIdx: index("nova_idx").on(table.novaGroup),
  }),
);

// Halal/Haram Classification Tables
export const additiveClassifications = pgTable("additive_classifications", {
  code: varchar("code", { length: 10 }).primaryKey(),
  name: text("name").notNull(),
  halalStatus: varchar("halal_status", { length: 20 }).notNull(),
  source: text("source"),
  notes: text("notes"),
});

export const haramKeywords = pgTable("haram_keywords", {
  keyword: varchar("keyword", { length: 100 }).primaryKey(),
  status: varchar("status", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }),
  notes: text("notes"),
});
