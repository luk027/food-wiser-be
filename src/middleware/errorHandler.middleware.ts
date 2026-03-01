import type { ErrorHandler } from "hono";
import { logger } from "@utils/logger.util";
import { createResponse } from "@utils/response.util";

export const errorHandler: ErrorHandler = (err, c) => {
  logger.error(
    `[Unhandled Exception] ${c.req.method} ${c.req.url} - ${err.message}`,
  );

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // --- 1. Handle Zod Validation Errors ---
  if (err && err.name === "ZodError") {
    try {
      // Zod errors usually have an 'issues' array, but if it gets stripped by the runtime,
      // Zod always leaves a stringified JSON array in the err.message!
      const issues = (err as any).issues || JSON.parse(err.message);

      const errorMessage = issues.map((e: any) => e.message).join(", ");

      return c.json(createResponse(false, errorMessage, 400), 400);
    } catch (parseError) {
      // Failsafe just in case
      return c.json(createResponse(false, "Invalid input format", 400), 400);
    }
  }

  // --- 2. Handle Hono HTTPExceptions & Standard Errors ---
  const statusCode = "status" in err ? (err as any).status : 500;

  return c.json(
    createResponse(false, err.message || "Internal Server Error", statusCode),
    statusCode,
  );
};
