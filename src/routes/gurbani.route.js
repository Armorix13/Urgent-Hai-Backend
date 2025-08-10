import express from "express";
import { gurbaniController } from "../controllers/gurbani.controller.js";
const gurbaniRouter = express.Router();

// Gurbani CRUD
gurbaniRouter.post("/", gurbaniController.addGurbani);
gurbaniRouter.get("/", gurbaniController.getAllGurbani);
gurbaniRouter.get("/:id", gurbaniController.getGurbaniById);
gurbaniRouter.put("/:id", gurbaniController.updateGurbani);
gurbaniRouter.delete("/:id", gurbaniController.deleteGurbani);

// Baani CRUD inside Gurbani
gurbaniRouter.post("/:id/baanis", gurbaniController.addBaani);
gurbaniRouter.put("/:id/baanis/:baaniId", gurbaniController.updateBaani);
gurbaniRouter.delete("/:id/baanis/:baaniId", gurbaniController.deleteBaani);

export default gurbaniRouter;
