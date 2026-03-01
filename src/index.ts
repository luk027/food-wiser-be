import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "@config/env";
import { verifyDatabaseConnection } from "@db/connection";
import { requestLogger } from "@middleware/logger.middleware";
import { errorHandler } from "@middleware/errorHandler.middleware";
import apiRoutes from "@routes/index";
import { logger } from "@utils/logger.util";
import { createResponse } from "@utils/response.util";

const app = new Hono();

// --- 1. Global Middlewares ---
app.use("*", cors());
app.use("*", requestLogger);

// --- 2. Routes ---
app.get("/", (c) => c.text("Welcome to FoodWiser API!"));
app.route("/api/v1", apiRoutes);

// --- 3. 404 Fallback Handler ---
// Hono's native way to handle unmatched routes
app.notFound((c) => {
  logger.warn(`[404 Not Found] ${c.req.method} ${c.req.url}`);
  return c.json(createResponse(false, "API endpoint not found", 404));
});

// --- 4. Global Error Handling ---
app.onError(errorHandler);

// --- 5. Server Initialization ---
async function startServer() {
  await verifyDatabaseConnection();

  const port = env.PORT;
  logger.info(`🚀 Server starting on port ${port}...`);

  Bun.serve({
    fetch: app.fetch,
    port: port,
    idleTimeout: 30,
  });

  logger.info(`✅ Server is live at http://localhost:${port}`);
}

startServer();
