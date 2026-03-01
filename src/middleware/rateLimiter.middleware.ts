import { getConnInfo } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";
import { createResponse } from "@utils/response.util";
import type { Context } from "hono";

export const apiRateLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 50 requests per window
  standardHeaders: "draft-6",

  keyGenerator: (c: Context) => {
    // 1. Check for proxy headers first (Crucial for production like Vercel/Render/Cloudflare)
    const forwardedFor = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwardedFor) return forwardedFor;

    const cfIp = c.req.header("cf-connecting-ip");
    if (cfIp) return cfIp;

    // 2. Extract the native IP directly from the Bun runtime (Crucial for local dev & direct connections)
    try {
      const connInfo = getConnInfo(c);
      if (connInfo.remote.address) {
        return connInfo.remote.address; // This will return '127.0.0.1' or '::1' locally!
      }
    } catch (error) {
      // Safely ignore if getConnInfo fails for some reason
    }

    // 3. The absolute last resort (Should practically never happen now)
    return "global_fallback";
  },

  handler: (c) => {
    return c.json(
      createResponse(false, "Too many requests. Please try again later.", 429),
      429,
    );
  },
});
