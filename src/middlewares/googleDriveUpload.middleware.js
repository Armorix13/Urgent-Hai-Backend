import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..", "..");

const tempDir = path.join(projectRoot, "uploads", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || "";
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

/** Single or multiple files; any field name (e.g. `file`, `files`, `document`). Max 500 MB each, up to 40 files. */
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 40,
  },
  fileFilter: (_req, _file, cb) => cb(null, true),
});

export const googleDriveUploadMiddleware = upload.any();
