import express from "express";
import userRoute from "./user.route.js";
import { fileUpload } from "../controllers/upload.controller.js";
import categoryRoute from "./category.route.js";
import subcategoryRoute from "./subcategory.route.js";
const router = express.Router();

//file upload
router.post("/file-upload",fileUpload);
router.use("/user",userRoute);
router.use("/category",categoryRoute);
router.use("/subcategory",subcategoryRoute);



export default router;