import express from "express";
import userRoute from "./user.route.js";
import { fileUpload } from "../controllers/upload.controller.js";
import { multerUpload } from "../services/upload.service.js";
import categoryRoute from "./category.route.js";
import productRoute from "./product.route.js";
import raagRoute from "./raag.route.js";
import raagDetailRoute from "./raagDetail.route.js";
import videoRouter from "./video.route.js";
import gurbaniRouter from "./gurbani.route.js";
import collaboratorRoute from "./collaborator.route.js";
import suggestionRoute from "./suggestion.route.js";
import planRoute from "./plan.route.js";
import subscriptionRoute from "./subscription.route.js";
import previousResultRoute from "./previousResult.route.js";
import courseRoute from "./course.route.js";
import courseVideoRoute from "./courseVideo.route.js";
import enrollmentRoute from "./enrollment.route.js";
import googleDriveRoute from "./googleDrive.route.js";
import ratingRoute from "./rating.route.js";

const router = express.Router();

//file upload
router.post("/file-upload", multerUpload, fileUpload);
router.use("/user", userRoute);
router.use("/category", categoryRoute);
router.use("/product", productRoute);
router.use("/raag", raagRoute);
router.use("/raag-detail", raagDetailRoute);
router.use("/video-tutorial", videoRouter);
router.use("/gurbani", gurbaniRouter);
router.use("/collaborator", collaboratorRoute);
router.use("/suggestion", suggestionRoute);
router.use("/plan", planRoute);
router.use("/subscription", subscriptionRoute);
router.use("/previous-result", previousResultRoute);
router.use("/course", courseRoute);
router.use("/course-video", courseVideoRoute);
router.use("/enrollment", enrollmentRoute);
router.use("/google-drive", googleDriveRoute);
router.use("/rating", ratingRoute);

export default router;
