import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import chalk from "chalk";
import errorHandler from "./middlewares/error.middleware.js";
import router from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

connectDB()
  .then(() => {
    console.log(
      chalk.bgGreen(chalk.green("✅ Connected to database successfully"))
    );
  })
  .catch((err) => {
    console.log(
      chalk.bgRed(chalk.red(`❌ Error connecting to database: ${err.message}`))
    );
  });

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).split("src")[0];

// Serve Static Files
app.use("/image", express.static(path.join(__dirname, "view/image")));
app.use("/pdf", express.static(path.join(__dirname, "view/pdf")));
app.use("/video", express.static(path.join(__dirname, "view/video")));
app.use("/audio", express.static(path.join(__dirname, "view/audio")));

app.use("/api/v1", router);

app.use("*", (req, res, next) => {
  try {
    throw new Error("Routes Not Found");
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

export default app;
