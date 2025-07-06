import express from "express";
import { categoryController } from "../controllers/category.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import categoryValidationSchemas from "../schema/category.schema.js";

const categoryRoute = express.Router();

categoryRoute.post(
  "/",
  validate(categoryValidationSchemas.addCategorySchema),
  authenticate,
  categoryController.addCategory
);

categoryRoute.get(
  "/",
  validate(categoryValidationSchemas.getAllCategoriesSchema),
  authenticate,
  categoryController.getAllCategories
);

categoryRoute.put(
  "/:id",
  validate(categoryValidationSchemas.updateCategorySchema),
  authenticate,
  categoryController.updateCategory
);

categoryRoute.delete(
  "/:id",
  validate(categoryValidationSchemas.deleteCategorySchema),
  authenticate,
  categoryController.deleteCategory
);

export default categoryRoute;
