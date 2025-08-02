import express from "express";
import { raagDetailController } from "../controllers/raagDetail.controller.js";

const router = express.Router();

router.post("/", raagDetailController.addRaagDetail);
router.get("/", raagDetailController.getAllRaagDetails);
router.get("/:id", raagDetailController.getRaagDetailById);
router.put("/:id", raagDetailController.updateRaagDetail);
router.delete("/:id", raagDetailController.deleteRaagDetail);

export default router;
