import fs from "fs";
import { initDriveClient } from "../config/googleDrive.js";
import logger from "../utils/logger.js";

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

const normalizeFolderPath = (folderPath) => {
  if (!folderPath || typeof folderPath !== "string") return [];
  return folderPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
};

const escapeDriveQuery = (value) => String(value).replace(/'/g, "\\'");

/**
 * Ensure nested folders exist under base folder; returns final folder id.
 * @param {string|null|undefined} baseFolderId - Usually GOOGLE_DRIVE_FOLDER_ID
 * @param {string|null|undefined} folderPath - e.g. "courses/2024"
 */
export const ensureFolderPath = async (baseFolderId, folderPath) => {
  const drive = initDriveClient();
  const segments = normalizeFolderPath(folderPath);

  if (segments.length === 0) {
    return baseFolderId || undefined;
  }

  let currentParentId = baseFolderId || "root";

  for (const segment of segments) {
    const escapedName = escapeDriveQuery(segment);
    const parentFilter = `'${currentParentId}' in parents`;
    const q = `name = '${escapedName}' and mimeType = '${DRIVE_FOLDER_MIME}' and ${parentFilter} and trashed = false`;

    const listResponse = await drive.files.list({
      q,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const existing = listResponse.data.files?.[0];
    if (existing?.id) {
      currentParentId = existing.id;
      continue;
    }

    const createResponse = await drive.files.create({
      requestBody: {
        name: segment,
        mimeType: DRIVE_FOLDER_MIME,
        parents: [currentParentId],
      },
      fields: "id",
      supportsAllDrives: true,
    });

    if (!createResponse.data.id) {
      throw new Error(`Failed to create Drive folder: ${segment}`);
    }

    currentParentId = createResponse.data.id;
  }

  return currentParentId || undefined;
};

/**
 * @param {import('multer').File} fileObject
 * @param {string} [resolvedFolderId]
 */
const uploadFileToDriveWithResolvedFolder = async (fileObject, resolvedFolderId) => {
  const tempFilePath = fileObject.path;

  try {
    const drive = initDriveClient();

    const fileMetadata = {
      name: fileObject.originalname || "upload",
    };

    if (resolvedFolderId) {
      fileMetadata.parents = [resolvedFolderId];
    }

    logger.info(`Uploading file: ${fileObject.originalname} to Google Drive`);

    const media = {
      mimeType: fileObject.mimetype || "application/octet-stream",
      body: fs.createReadStream(fileObject.path),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields:
        "id, name, mimeType, webViewLink, webContentLink, createdTime, size",
      supportsAllDrives: true,
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error("Failed to get file ID from Google Drive response");
    }

    logger.info(`File uploaded successfully. File ID: ${fileId}`);

    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
        supportsAllDrives: true,
      });
      logger.info(`File ${fileId} made public`);
    } catch (permError) {
      logger.warn(`Could not make file public: ${permError?.message || permError}`);
    }

    const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    return {
      success: true,
      fileId,
      fileName: response.data.name || fileObject.originalname,
      mimeType: response.data.mimeType || fileObject.mimetype,
      url: fileUrl,
      webViewLink: response.data.webViewLink || undefined,
      webContentLink: response.data.webContentLink || undefined,
      size: response.data.size
        ? parseInt(response.data.size, 10)
        : fileObject.size,
      createdTime: response.data.createdTime || undefined,
    };
  } catch (error) {
    logger.error("Error uploading file to Google Drive:", error);
    throw error;
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkError) {
        logger.error("Error cleaning up temporary file:", unlinkError);
      }
    }
  }
};

/**
 * @param {import('multer').File} fileObject
 * @param {string|null} [folderPath] - path under GOOGLE_DRIVE_FOLDER_ID
 */
export const uploadFileToDrive = async (fileObject, folderPath = null) => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const resolvedFolderId = await ensureFolderPath(folderId, folderPath);
  return uploadFileToDriveWithResolvedFolder(fileObject, resolvedFolderId);
};

/**
 * @param {import('multer').File[]} fileObjects
 * @param {string|null} [folderPath]
 */
export const uploadMultipleFilesToDrive = async (fileObjects, folderPath = null) => {
  if (!fileObjects?.length) {
    throw new Error("No files to upload");
  }

  logger.info(`Uploading ${fileObjects.length} files to Google Drive`);

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const resolvedFolderId = await ensureFolderPath(folderId, folderPath);

  const results = await Promise.all(
    fileObjects.map((file) =>
      uploadFileToDriveWithResolvedFolder(file, resolvedFolderId)
    )
  );

  logger.info(`Successfully uploaded ${results.length} files`);
  return results;
};

export const deleteFileFromDrive = async (fileId) => {
  const drive = initDriveClient();
  logger.info(`Deleting file from Google Drive: ${fileId}`);
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
  return { success: true, message: "File deleted successfully" };
};

export const getFileMetadata = async (fileId) => {
  const drive = initDriveClient();
  const response = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size, createdTime, webViewLink, owners",
    supportsAllDrives: true,
  });
  return response.data;
};

/** @param {string} mimeType */
export const getFileCategory = (mimeType) => {
  if (!mimeType) return "other";
  const m = mimeType.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (
    m.includes("word") ||
    m.includes("document") ||
    m.includes("spreadsheet") ||
    m.includes("presentation") ||
    m === "text/plain" ||
    m === "text/csv"
  ) {
    return "document";
  }
  if (m.includes("zip") || m.includes("compressed")) return "archive";
  return "other";
};

const MAX_BYTES = 500 * 1024 * 1024;

/**
 * @param {import('multer').File[]} files
 */
export const validateDriveFiles = (files) => {
  const results = (files || []).map((f) => {
    const fileName = f.originalname || "file";
    if (!f.path) {
      return { valid: false, fileName, error: "Invalid file (no path)" };
    }
    if (f.size > MAX_BYTES) {
      return {
        valid: false,
        fileName,
        error: `File exceeds ${MAX_BYTES / (1024 * 1024)} MB limit`,
      };
    }
    return { valid: true, fileName };
  });
  return { allValid: results.every((r) => r.valid), results };
};
