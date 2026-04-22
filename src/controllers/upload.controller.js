import { multerUpload } from "../services/upload.service.js";

/**
 * Map multer disk destination → Express static path (`/image`, `/pdf`, …).
 * Avoids brittle `path.split("view")` on Windows / mixed casing.
 */
function publicUrlFromMulterFile(file) {
  if (!file?.filename) return null;
  const name = file.filename;
  const dest = String(file.destination || "")
    .replace(/\\/g, "/")
    .toLowerCase();
  if (/\/image(\/|$)/.test(dest) || dest.endsWith("/image") || dest.endsWith("image")) {
    return `/image/${name}`;
  }
  if (/\/pdf(\/|$)/.test(dest) || dest.endsWith("/pdf") || dest.endsWith("pdf")) {
    return `/pdf/${name}`;
  }
  if (/\/video(\/|$)/.test(dest) || dest.endsWith("/video") || dest.endsWith("video")) {
    return `/video/${name}`;
  }
  if (/\/audio(\/|$)/.test(dest) || dest.endsWith("/audio") || dest.endsWith("audio")) {
    return `/audio/${name}`;
  }
  if (file.mimetype?.startsWith("image/")) return `/image/${name}`;
  if (file.mimetype === "application/pdf") return `/pdf/${name}`;
  if (file.mimetype?.startsWith("video/")) return `/video/${name}`;
  if (file.mimetype?.startsWith("audio/")) return `/audio/${name}`;
  return `/image/${name}`;
}

export const fileUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error("No valid file data provided");
    }

    const fileUrl = publicUrlFromMulterFile(req.file);
    if (!fileUrl) {
      throw new Error("Could not resolve public URL for upload");
    }

    const message = `${
      req.file.mimetype.startsWith("image/")
        ? "Image"
        : req.file.mimetype.startsWith("video/")
          ? "Video"
          : req.file.mimetype.startsWith("audio/")
            ? "Audio"
            : "PDF"
    } uploaded successfully`;

    return res.status(200).json({
      success: true,
      message,
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
};
