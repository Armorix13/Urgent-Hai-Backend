import express from "express";
import { videoController } from "../controllers/video.controller.js";

const videoRouter = express.Router();

// Add new video
videoRouter.post("/", videoController.addVideo);

// Get all videos (with pagination)
videoRouter.get("/", videoController.getAllVideos);

// Get video by ID
videoRouter.get("/:id", videoController.getVideoById);

// Update video by ID
videoRouter.put("/:id", videoController.updateVideo);

// Delete video by ID
videoRouter.delete("/:id", videoController.deleteVideo);

export default videoRouter;
