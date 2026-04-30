import express from "express";
import { courseVideoBookmarkController } from "../controllers/courseVideoBookmark.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import courseVideoBookmarkValidationSchemas from "../schema/courseVideoBookmark.schema.js";

const courseVideoBookmarkRoute = express.Router();

courseVideoBookmarkRoute.get(
  "/",
  authenticate,
  validate(courseVideoBookmarkValidationSchemas.getMyBookmarksSchema),
  courseVideoBookmarkController.getMyBookmarks
);

courseVideoBookmarkRoute.post(
  "/",
  authenticate,
  validate(courseVideoBookmarkValidationSchemas.addBookmarkSchema),
  courseVideoBookmarkController.addBookmark
);

courseVideoBookmarkRoute.get(
  "/:id",
  authenticate,
  validate(courseVideoBookmarkValidationSchemas.bookmarkIdParamSchema),
  courseVideoBookmarkController.getBookmarkById
);

courseVideoBookmarkRoute.put(
  "/:id",
  authenticate,
  validate(courseVideoBookmarkValidationSchemas.updateBookmarkSchema),
  courseVideoBookmarkController.updateBookmark
);

courseVideoBookmarkRoute.delete(
  "/:id",
  authenticate,
  validate(courseVideoBookmarkValidationSchemas.deleteBookmarkSchema),
  courseVideoBookmarkController.deleteBookmark
);

export default courseVideoBookmarkRoute;
