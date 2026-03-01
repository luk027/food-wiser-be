import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@config/env";
import { logger } from "@utils/logger.util";
import * as schema from "./schema";

// Create postgres client
const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  debug: env.NODE_ENV === "development",
});

// Create drizzle instance
export const db = drizzle(sql, { schema });

//Verify database connectivity at startup
export async function verifyDatabaseConnection() {
  try {
    logger.info("🔌 Verifying database connection...");
    await sql`SELECT 1`;
    logger.info("✅ Database connection verified");
  } catch (error) {
    logger.error("❌ Database connection failed");
    console.error(error);
    process.exit(1);
  }
}
