import express from "express";
import { collaboratorController } from "../controllers/collaborator.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import collaboratorValidationSchemas from "../schema/collaborator.schema.js";

const collaboratorRoute = express.Router();

collaboratorRoute.post(
  "/add",
  validate(collaboratorValidationSchemas.addCollaboratorSchema),
//   authenticate,
  collaboratorController.addCollaborator
);

collaboratorRoute.put(
  "/update/:id",
  validate(collaboratorValidationSchemas.updateCollaboratorSchema),
//   authenticate,
  collaboratorController.updateCollaborator
);

collaboratorRoute.get(
  "/get/:id",
//   authenticate,
  collaboratorController.getCollaboratorById
);

collaboratorRoute.get(
  "/get-all",
//   authenticate,
  collaboratorController.getAllCollaborators
);

export default collaboratorRoute;
