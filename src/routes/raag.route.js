import express from "express";
import { raagController } from "../controllers/raag.controller.js";

const router = express.Router();

router.post("/add", raagController.addRaag);
router.get("/all", raagController.getAllRaags);
router.get("/detail/:id", raagController.getRaagById);
router.put("/update/:id", raagController.updateRaag);
router.delete("/delete/:id", raagController.deleteRaag);

export default router;
