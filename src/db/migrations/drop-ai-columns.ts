import { db } from "@db/connection";
import { logger } from "@utils/logger.util";
import { sql } from "drizzle-orm";

/**
 * Migration: Drop unused AI-only columns `overview` and `ai_insight` from the products table.
 */
async function run() {
  logger.info("Running migration: drop overview and ai_insight columns...");

  await db.execute(
    sql`ALTER TABLE products DROP COLUMN IF EXISTS overview, DROP COLUMN IF EXISTS ai_insight`,
  );

  logger.info("✅ Migration complete: overview and ai_insight columns removed.");
  process.exit(0);
}

run().catch((err) => {
  logger.error(`Migration failed: ${(err as Error).message}`);
  process.exit(1);
});
