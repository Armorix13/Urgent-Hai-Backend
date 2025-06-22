import express from "express";
import userRoute from "./user.route.js";
import { fileUpload } from "../controllers/upload.controller.js";
const router = express.Router();

//file upload
router.post("/file-upload", fileUpload);
router.use("/user", userRoute);

export default router;
