import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).split("services")[0];

const imageDir = path.join(__dirname, "view", "image");
const pdfDir = path.join(__dirname, "view", "pdf");
const videoDir = path.join(__dirname, "view", "video");
const audioDir = path.join(__dirname, "view", "audio");


if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}

if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

export const base64Upload = async (req, res, next) => {
    try {
        if (!req.body.file || !req.body.file.startsWith("data:")) {
            throw new Error("Invalid or missing Base64 data");
        }

        const base64Data = req.body.file.split(",")[1];
        const mimeType = req.body.file.split(";")[0].split(":")[1];
        const fileExtension = mime.extension(mimeType);

        if (!fileExtension) {
            throw new Error("Unsupported file type");
        }

        const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
        let filePath;
        let fileUrl;

        if (mimeType.startsWith("image/")) {
            filePath = path.join(imageDir, fileName);
            fileUrl = `${process.env.BASE_URL}/image/${fileName}`;
        } else if (mimeType === "application/pdf") {
            filePath = path.join(pdfDir, fileName);
            fileUrl = `${process.env.BASE_URL}/pdf/${fileName}`;
        } else if (mimeType.startsWith("video/")) {
            filePath = path.join(videoDir, fileName);
            fileUrl = `${process.env.BASE_URL}/video/${fileName}`;
        } else if (mimeType.startsWith("audio/")) {
            filePath = path.join(audioDir, fileName);
            fileUrl = `${process.env.BASE_URL}/audio/${fileName}`;
        } else {
            throw new Error("Unsupported file type");
        }

        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(filePath, buffer);
        
        return {
            message: `${mimeType.startsWith("image/") ? "Image" : mimeType.startsWith("video/") ? "Video" : mimeType.startsWith("audio/") ? "Audio" : "PDF"} uploaded successfully`,
            url: fileUrl,
        };
    } catch (error) {
        next(error);
    }
};
