import { Hono } from "hono";
import { ProductController } from "@/controller";

const productRoutes = new Hono();

productRoutes.get("/scan/:barcode", ProductController.scanProduct);

export default productRoutes;
