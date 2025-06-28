// import { base64Upload } from "../services/upload.service.js";
import { multerUpload } from "../services/upload.service.js";

export const fileUpload = async (req, res, next) => {
  try {
    let response;

    // Check if the request contains a multipart file using Multer
    if (req.file) {
      const publicPath = req.file.path.split("view")[1]; // Extract relative path after 'view'
      const fileUrl = `${publicPath.replace(/\\/g, "/")}`;
      response = {
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
      };
    } else {
      throw new Error("No valid file data provided");
    }

    return res.status(200).json({
      success: true,
      message: response.message,
      url: response.url,
    });
  } catch (error) {
    next(error);
  }
};
