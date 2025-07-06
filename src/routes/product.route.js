import express from "express";
import { productController } from "../controllers/product.controller.js";
import validate from "../middlewares/validate.middleware.js";
import productValidationSchemas from "../schema/product.schema.js";
import authenticate from "../middlewares/auth.middleware.js";

const productRoute = express.Router();

productRoute.post(
  "/",
  validate(productValidationSchemas.addProductSchema),
  authenticate,
  productController.addProduct
);

productRoute.get(
  "/",
  validate(productValidationSchemas.getAllProductsSchema),
  authenticate,
  productController.getAllProducts
);

productRoute.get(
  "/:id",
  validate(productValidationSchemas.getProductByIdSchema),
  authenticate,
  productController.getProductById
);

productRoute.put(
  "/:id",
  validate(productValidationSchemas.updateProductSchema),
  authenticate,
  productController.updateProduct
);

productRoute.delete(
  "/:id",
  validate(productValidationSchemas.deleteProductSchema),
  authenticate,
  productController.deleteProduct
);

export default productRoute;
