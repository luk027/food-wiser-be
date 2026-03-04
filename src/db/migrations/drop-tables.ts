import { sql } from "drizzle-orm";
import { db } from "@db/connection";
import { logger } from "@utils/logger.util";

async function dropTables() {
  try {
    logger.warn("⚠️  Dropping all tables...");

    await db.execute(sql`DROP TABLE IF EXISTS products CASCADE;`);
    logger.info("Dropped: products");

    await db.execute(
      sql`DROP TABLE IF EXISTS additive_classifications CASCADE;`,
    );
    logger.info("Dropped: additive_classifications");

    await db.execute(sql`DROP TABLE IF EXISTS haram_keywords CASCADE;`);
    logger.info("Dropped: haram_keywords");

    logger.info("✅ All tables dropped successfully");
  } catch (error) {
    logger.error(`Failed to drop tables: ${(error as Error).message}`);
    throw error;
  }
}

// Run if called directly
if (import.meta.main) {
  dropTables()
    .then(() => {
      logger.info("Drop complete. Now run: bun run db:push");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Drop failed");
      console.error(error);
      process.exit(1);
    });
}

export { dropTables };
