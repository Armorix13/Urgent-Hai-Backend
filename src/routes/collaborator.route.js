import express from "express";
import { collaboratorController } from "../controllers/collaborator.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import collaboratorValidationSchemas from "../schema/collaborator.schema.js";

const collaboratorRoute = express.Router();

collaboratorRoute.post(
  "/lookup",
  validate(collaboratorValidationSchemas.lookupCollaboratorSchema),
  collaboratorController.lookupCollaborator
);

collaboratorRoute.post(
  "/login",
  validate(collaboratorValidationSchemas.loginCollaboratorSchema),
  collaboratorController.loginCollaborator
);

collaboratorRoute.post(
  "/add",
  validate(collaboratorValidationSchemas.addCollaboratorSchema),
//   authenticate,
  collaboratorController.addCollaborator
);

collaboratorRoute.post(
  "/set-password",
  validate(collaboratorValidationSchemas.setCollaboratorPasswordSchema),
  collaboratorController.setCollaboratorPassword
);

collaboratorRoute.get("/me", authenticate, collaboratorController.getCollaboratorMe);
collaboratorRoute.patch(
  "/me",
  authenticate,
  validate(collaboratorValidationSchemas.updateCollaboratorMeSchema),
  collaboratorController.updateCollaboratorMe
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

collaboratorRoute.delete(
  "/delete/:id",
  validate(collaboratorValidationSchemas.deleteCollaboratorSchema),
//   authenticate,
  collaboratorController.deleteCollaborator
);

export default collaboratorRoute;
