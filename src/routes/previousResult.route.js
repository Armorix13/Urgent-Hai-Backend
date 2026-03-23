import express from "express";
import { previousResultController } from "../controllers/previousResult.controller.js";

const previousResultRoute = express.Router();

previousResultRoute.post("/", previousResultController.addPreviousResult);
previousResultRoute.get("/", previousResultController.getAllPreviousResults);
previousResultRoute.get("/:id", previousResultController.getPreviousResultById);
previousResultRoute.put("/:id", previousResultController.updatePreviousResult);
previousResultRoute.delete("/:id", previousResultController.deletePreviousResult);

export default previousResultRoute;
