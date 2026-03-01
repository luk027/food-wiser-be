import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().nonempty(),
  GEMINI_API_KEY: z.string().min(10).nonempty(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
