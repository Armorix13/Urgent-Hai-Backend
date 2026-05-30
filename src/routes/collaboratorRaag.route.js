import express from "express";
import * as collaboratorRaagController from "../controllers/collaboratorRaag.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const collaboratorRaagRoute = express.Router();

collaboratorRaagRoute.get("/", authenticate, collaboratorRaagController.getAllRaags);
collaboratorRaagRoute.get("/:id", authenticate, collaboratorRaagController.getRaagById);
collaboratorRaagRoute.post("/", authenticate, collaboratorRaagController.createRaag);
collaboratorRaagRoute.put("/:id", authenticate, collaboratorRaagController.updateRaag);
collaboratorRaagRoute.delete("/:id", authenticate, collaboratorRaagController.deleteRaag);

export default collaboratorRaagRoute;
