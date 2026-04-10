import express from "express";
import { sectionController } from "../controllers/section.controller.js";
import validate from "../middlewares/validate.middleware.js";
import sectionValidationSchemas from "../schema/section.schema.js";

const sectionRoute = express.Router();

sectionRoute.post(
  "/",
  validate(sectionValidationSchemas.upsertSectionSchema),
  sectionController.upsertSection
);

sectionRoute.get(
  "/collaborator/:collaboratorId",
  validate(sectionValidationSchemas.getSectionsByCollaboratorSchema),
  sectionController.getSectionsByCollaboratorId
);

sectionRoute.get(
  "/:id",
  validate(sectionValidationSchemas.getSectionByIdSchema),
  sectionController.getSectionById
);

sectionRoute.delete(
  "/:id",
  validate(sectionValidationSchemas.deleteSectionSchema),
  sectionController.deleteSection
);

export default sectionRoute;
