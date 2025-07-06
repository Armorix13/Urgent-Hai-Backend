import express from "express";
import userRoute from "./user.route.js";
import { fileUpload } from "../controllers/upload.controller.js";
import { multerUpload } from "../services/upload.service.js";
import categoryRoute from "./category.route.js";
import productRoute from "./product.route.js";
const router = express.Router();

//file upload
router.post("/file-upload", multerUpload, fileUpload);
router.use("/user", userRoute);
router.use("/category", categoryRoute);
router.use("/product", productRoute);

export default router;
