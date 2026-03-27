import {
  uploadMultipleFilesToDrive,
  getFileCategory,
  validateDriveFiles,
  deleteFileFromDrive,
  getFileMetadata,
} from "../services/googleDrive.service.js";
import logger from "../utils/logger.js";

const folderFromRequest = (req) => {
  const q = req.query?.folder;
  const b = req.body?.folder;
  if (typeof b === "string" && b.trim()) return b.trim();
  if (typeof q === "string" && q.trim()) return q.trim();
  return null;
};

/**
 * POST /api/v1/google-drive/upload
 *
 * Recommended form-data keys (Postman):
 * - `files` — File (repeat row for multiple uploads), or `file` for one file
 * - `folder` — Text, optional nested folder under GOOGLE_DRIVE_FOLDER_ID
 */
export const uploadToGoogleDrive = async (req, res, next) => {
  try {
    const files = req.files?.length ? req.files : req.file ? [req.file] : [];

    logger.info(
      `Google Drive upload: ${files.length} file(s), folder=${folderFromRequest(req) || "default"}`
    );

    if (!files.length) {
      const err = new Error("No files provided. Use multipart/form-data with one or more file fields.");
      err.statusCode = 400;
      throw err;
    }

    const validation = validateDriveFiles(files);
    if (!validation.allValid) {
      const errors = validation.results
        .filter((r) => !r.valid)
        .map((r) => `${r.fileName}: ${r.error}`);
      const err = new Error(`File validation failed: ${errors.join("; ")}`);
      err.statusCode = 400;
      throw err;
    }

    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
      const err = new Error(
        "GOOGLE_DRIVE_FOLDER_ID is not set. Add it to your environment."
      );
      err.statusCode = 500;
      throw err;
    }

    const folderPath = folderFromRequest(req);
    const uploadResults = await uploadMultipleFilesToDrive(files, folderPath);

    const enhancedResults = uploadResults.map((result) => ({
      success: true,
      fileId: result.fileId,
      fileName: result.fileName,
      mimeType: result.mimeType,
      url: result.url,
      webViewLink: result.webViewLink,
      size: result.size ?? 0,
      category: getFileCategory(result.mimeType),
      uploadedAt: new Date().toISOString(),
    }));

    if (files.length === 1) {
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: { file: enhancedResults[0] },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      data: {
        files: enhancedResults,
        totalFiles: enhancedResults.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGoogleDriveFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      const err = new Error("fileId is required");
      err.statusCode = 400;
      throw err;
    }
    await deleteFileFromDrive(fileId);
    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getGoogleDriveFileMetadata = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      const err = new Error("fileId is required");
      err.statusCode = 400;
      throw err;
    }
    const meta = await getFileMetadata(fileId);
    return res.status(200).json({
      success: true,
      message: "OK",
      data: meta,
    });
  } catch (error) {
    next(error);
  }
};
