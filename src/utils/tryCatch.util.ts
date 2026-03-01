import type { Context, Next } from "hono";

type HonoController = (c: Context, next: Next) => Promise<Response | void>;

export const TryCatch = (controller: HonoController) => {
  return async (c: Context, next: Next) => {
    try {
      return await controller(c, next);
    } catch (error) {
      // In Hono, throwing the error passes it to the global onError handler
      throw error;
    }
  };
};
