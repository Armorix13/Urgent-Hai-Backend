import express from "express";
import userRoute from "./user.route.js";
import { fileUpload } from "../controllers/upload.controller.js";
import { multerUpload } from "../services/upload.service.js";
import categoryRoute from "./category.route.js";
import productRoute from "./product.route.js";
import raagRoute from "./raag.route.js";
import raagDetailRoute from "./raagDetail.route.js";
const router = express.Router();

//file upload
router.post("/file-upload", multerUpload, fileUpload);
router.use("/user", userRoute);
router.use("/category", categoryRoute);
router.use("/product", productRoute);
router.use("/raag", raagRoute);
router.use("/raag-detail", raagDetailRoute);

export default router;
