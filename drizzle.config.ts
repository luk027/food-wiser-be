import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env.ts";

// Explicitly use process.env with a fallback to avoid all TS errors
const databaseUrl = (env?.DATABASE_URL as string) || "";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
