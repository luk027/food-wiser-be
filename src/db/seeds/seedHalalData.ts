import { db } from "@db/connection";
import { additiveClassifications, haramKeywords } from "@db/schema";
import { logger } from "@utils/logger.util";

const commonAdditives = [
  // HARAM
  {
    code: "E120",
    name: "Carmine/Cochineal",
    halalStatus: "haram",
    source: "insect-derived",
    notes: "Red dye from insects",
  },
  {
    code: "E441",
    name: "Gelatin",
    halalStatus: "haram",
    source: "animal-derived",
    notes: "Unless halal/fish certified",
  },
  {
    code: "E542",
    name: "Bone phosphate",
    halalStatus: "haram",
    source: "animal-bone",
    notes: null,
  },
  {
    code: "E901",
    name: "Beeswax",
    halalStatus: "haram",
    source: "insect-derived",
    notes: null,
  },

  // DOUBTFUL
  {
    code: "E471",
    name: "Mono- and diglycerides",
    halalStatus: "doubtful",
    source: "mixed",
    notes: "Can be plant or animal",
  },
  {
    code: "E472",
    name: "Esters of mono/diglycerides",
    halalStatus: "doubtful",
    source: "mixed",
    notes: null,
  },
  {
    code: "E476",
    name: "Polyglycerol polyricinoleate",
    halalStatus: "doubtful",
    source: "mixed",
    notes: null,
  },
  {
    code: "E481",
    name: "Sodium stearoyl lactylate",
    halalStatus: "doubtful",
    source: "mixed",
    notes: null,
  },
  {
    code: "E482",
    name: "Calcium stearoyl lactylate",
    halalStatus: "doubtful",
    source: "mixed",
    notes: null,
  },
  {
    code: "E631",
    name: "Disodium inosinate",
    halalStatus: "doubtful",
    source: "mixed",
    notes: "May contain pork",
  },
  {
    code: "E635",
    name: "Disodium 5'-ribonucleotides",
    halalStatus: "doubtful",
    source: "mixed",
    notes: null,
  },

  // HALAL
  {
    code: "E322",
    name: "Lecithins",
    halalStatus: "halal",
    source: "plant-based",
    notes: "Usually soy",
  },
  {
    code: "E322I",
    name: "Soy lecithin",
    halalStatus: "halal",
    source: "plant-based",
    notes: null,
  },
  {
    code: "E300",
    name: "Ascorbic acid",
    halalStatus: "halal",
    source: "synthetic",
    notes: "Vitamin C",
  },
  {
    code: "E330",
    name: "Citric acid",
    halalStatus: "halal",
    source: "synthetic",
    notes: null,
  },
];

const haramKeywordsList = [
  // Pork
  { keyword: "pork", status: "haram", category: "meat", notes: null },
  { keyword: "bacon", status: "haram", category: "meat", notes: null },
  { keyword: "ham", status: "haram", category: "meat", notes: null },
  { keyword: "lard", status: "haram", category: "fat", notes: null },
  { keyword: "pancetta", status: "haram", category: "meat", notes: null },
  { keyword: "prosciutto", status: "haram", category: "meat", notes: null },

  // Alcohol
  { keyword: "alcohol", status: "haram", category: "alcohol", notes: null },
  { keyword: "wine", status: "haram", category: "alcohol", notes: null },
  { keyword: "beer", status: "haram", category: "alcohol", notes: null },
  { keyword: "rum", status: "haram", category: "alcohol", notes: null },
  { keyword: "vodka", status: "haram", category: "alcohol", notes: null },
  { keyword: "whisky", status: "haram", category: "alcohol", notes: null },
  { keyword: "whiskey", status: "haram", category: "alcohol", notes: null },

  // Doubtful
  {
    keyword: "gelatin",
    status: "doubtful",
    category: "animal-product",
    notes: "Unless fish/halal certified",
  },
  {
    keyword: "gelatine",
    status: "doubtful",
    category: "animal-product",
    notes: null,
  },
  {
    keyword: "rennet",
    status: "doubtful",
    category: "enzyme",
    notes: "Usually animal-derived",
  },
];

export async function seedHalalData() {
  try {
    logger.info("Seeding halal classification data...");

    // Seed additives
    for (const additive of commonAdditives) {
      await db
        .insert(additiveClassifications)
        .values(additive)
        .onConflictDoNothing();
    }

    // Seed keywords
    for (const keyword of haramKeywordsList) {
      await db.insert(haramKeywords).values(keyword).onConflictDoNothing();
    }

    logger.info(
      `✅ Seeded ${commonAdditives.length} additives and ${haramKeywordsList.length} keywords`,
    );
  } catch (error) {
    logger.error(`Failed to seed halal data: ${(error as Error).message}`);
  }
}

// Run if called directly
if (import.meta.main) {
  seedHalalData().then(() => process.exit(0));
}
