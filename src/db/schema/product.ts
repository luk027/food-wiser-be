import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    // PRIMARY KEY: Automatically creates a unique index on 'barcode'
    barcode: varchar("barcode", { length: 255 }).primaryKey(),

    name: text("name").notNull(),
    brand: varchar("brand", { length: 255 }),
    overview: text("overview"),
    quantity: varchar("quantity", { length: 100 }),
    imageUrl: text("image_url"),
    ingredients: text("ingredients"),
    allergens: text("allergens"),
    additives: text("additives"),
    nutriScore: varchar("nutri_score", { length: 10 }),
    ecoScore: varchar("eco_score", { length: 10 }),
    dietaryStatus: varchar("dietary_status", { length: 50 }),
    halalStatus: varchar("halal_status", { length: 50 }),
    nutritionInfo: jsonb("nutrition_info"),
    countryOfOrigin: varchar("country_of_origin", { length: 255 }),
    packaging: varchar("packaging", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Manual indexes for the fields users will filter/search by
    brandIdx: index("brand_idx").on(table.brand),
    dietaryIdx: index("dietary_idx").on(table.dietaryStatus),
    halalIdx: index("halal_idx").on(table.halalStatus),
  }),
);
