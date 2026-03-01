import type { Context, Next } from "hono";
import { logger } from "@utils/logger.util";

export const requestLogger = async (c: Context, next: Next) => {
  const { method, url } = c.req;
  const start = Date.now();

  await next();

  const ms = Date.now() - start;
  logger.http(`[${method}] ${url} - Status: ${c.res.status} - ${ms}ms`);
};
