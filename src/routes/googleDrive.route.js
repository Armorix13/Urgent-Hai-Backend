import express from "express";
import {
  uploadToGoogleDrive,
  deleteGoogleDriveFile,
  getGoogleDriveFileMetadata,
} from "../controllers/googleDrive.controller.js";
import { googleDriveUploadMiddleware } from "../middlewares/googleDriveUpload.middleware.js";

const googleDriveRoute = express.Router();

/**
 * POST /api/v1/google-drive/upload
 *
 * Postman: Body → form-data (not raw JSON)
 * - Key: files    | Type: File    | Required — pick your file(s). For multiple files, add another row with the same key "files".
 * - Key: file     | Type: File    | Alternative for a single upload only (either "files" or "file").
 * - Key: folder   | Type: Text    | Optional — subpath under GOOGLE_DRIVE_FOLDER_ID, e.g. courses/intro (slashes, not backslashes).
 * Or: URL query ?folder=courses/intro
 */
googleDriveRoute.post(
  "/upload",
  googleDriveUploadMiddleware,
  uploadToGoogleDrive
);

googleDriveRoute.get("/file/:fileId", getGoogleDriveFileMetadata);
googleDriveRoute.delete("/file/:fileId", deleteGoogleDriveFile);

export default googleDriveRoute;
