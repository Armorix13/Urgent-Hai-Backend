import express from "express";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { categoryController } from "../controllers/category.controller.js";
import { categorySchemas } from "../schema/category.schema.js";

const categoryRoute = express.Router();

categoryRoute.post("/", validate(categorySchemas.addCategorySchema), authenticate, categoryController.addCategory);
categoryRoute.put("/:id", validate(categorySchemas.updateCategorySchema), authenticate, categoryController.updateCategory);
categoryRoute.get("/", validate(categorySchemas.getCategorySchema), authenticate, categoryController.getAllCategory);
categoryRoute.delete("/:id", validate(categorySchemas.deleteCategorySchema), authenticate, categoryController.deleteCategory);


export default categoryRoute;