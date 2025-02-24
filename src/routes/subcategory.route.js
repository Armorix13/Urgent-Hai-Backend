import express from "express";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { subcategoryController } from "../controllers/subcategory.controller.js";
import { subcategorySchemas } from "../schema/subcategory.schema.js";


const subcategoryRoute = express.Router();

subcategoryRoute.post("/", validate(subcategorySchemas.addSubCategorySchema), authenticate, subcategoryController.addSubCategory);
subcategoryRoute.put("/:id", validate(subcategorySchemas.updateSubCategorySchema), authenticate, subcategoryController.updateSubCategory);
subcategoryRoute.get("/", validate(subcategorySchemas.getSubCategorySchema), authenticate, subcategoryController.getAllSubCategory);
subcategoryRoute.delete("/:id", validate(subcategorySchemas.deleteSubCategorySchema), authenticate, subcategoryController.deleteSubCategory);


export default subcategoryRoute;