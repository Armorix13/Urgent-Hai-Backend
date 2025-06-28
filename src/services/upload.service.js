import fs from "fs";
import path from "path";
import multer from "multer";
import mime from "mime-types";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).split("src")[0];

const imageDir = path.join(__dirname, "view", "image");
const pdfDir = path.join(__dirname, "view", "pdf");
const videoDir = path.join(__dirname, "view", "video");
const audioDir = path.join(__dirname, "view", "audio");

if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mimeType = file.mimetype;
    if (mimeType.startsWith("image/")) {
      cb(null, imageDir);
    } else if (mimeType === "application/pdf") {
      cb(null, pdfDir);
    } else if (mimeType.startsWith("video/")) {
      cb(null, videoDir);
    } else if (mimeType.startsWith("audio/")) {
      cb(null, audioDir);
    } else {
      cb(new Error("Unsupported file type"), null);
    }
  },
  filename: (req, file, cb) => {
    const fileExtension = mime.extension(file.mimetype);
    if (!fileExtension) {
      cb(new Error("Unsupported file type"), null);
    } else {
      const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
      cb(null, fileName);
    }
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const mimeType = file.mimetype;
    if (
      mimeType.startsWith("image/") ||
      mimeType === "application/pdf" ||
      mimeType.startsWith("video/") ||
      mimeType.startsWith("audio/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  },
});

export const multerUpload = upload.single("image");

export const handleMulterUpload = (req, res, next) => {
  if (!req.file) {
    return next(new Error("File is required"));
  }
  const fileUrl = `/${req.file.path
    .replace(__dirname, "")
    .replace(/\\/g, "/")}`;
  res.status(200).json({
    message: `${
      req.file.mimetype.startsWith("image/")
        ? "Image"
        : req.file.mimetype.startsWith("video/")
        ? "Video"
        : req.file.mimetype.startsWith("audio/")
        ? "Audio"
        : "PDF"
    } uploaded successfully`,
    url: fileUrl,
  });
};
