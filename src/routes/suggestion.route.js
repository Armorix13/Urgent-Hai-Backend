import express from "express";
import { suggestionController } from "../controllers/suggestion.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import suggestionValidationSchemas from "../schema/suggestion.schema.js";

const suggestionRoute = express.Router();

suggestionRoute.post(
  "/",
  authenticate,
  validate(suggestionValidationSchemas.addSuggestionSchema),
  suggestionController.createSuggestion
);

suggestionRoute.get("/", authenticate, suggestionController.getAllSuggestions);

suggestionRoute.get(
  "/user/:userId",
  authenticate,
  validate(suggestionValidationSchemas.getSuggestionsByUserIdSchema),
  suggestionController.getSuggestionsByUserId
);

suggestionRoute.get("/:id", authenticate, suggestionController.getSuggestionById);

suggestionRoute.put(
  "/:id",
  authenticate,
  validate(suggestionValidationSchemas.updateSuggestionSchema),
  suggestionController.updateSuggestion
);

suggestionRoute.delete("/:id", authenticate, suggestionController.deleteSuggestion);

export default suggestionRoute;
