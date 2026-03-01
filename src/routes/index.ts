import { Hono } from "hono";
import { apiRateLimiter } from "@/middleware/rateLimiter.middleware";
import productRoutes from "./product.routes";

const apiRoutes = new Hono();

apiRoutes.use("*", apiRateLimiter);
apiRoutes.route("/products", productRoutes);

export default apiRoutes;
