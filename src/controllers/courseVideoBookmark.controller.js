import { courseVideoBookmarkService } from "../services/courseVideoBookmark.service.js";

const addBookmark = async (req, res, next) => {
  try {
    const result = await courseVideoBookmarkService.createBookmark(req);
    const status = result.alreadyBookmarked ? 200 : 201;
    return res.status(status).json({
      success: true,
      message: result.alreadyBookmarked
        ? "Already in your bookmarks."
        : "Bookmark added successfully!",
      alreadyBookmarked: result.alreadyBookmarked,
      bookmark: result.bookmark,
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookmarks = async (req, res, next) => {
  try {
    const data = await courseVideoBookmarkService.getMyBookmarks(req);
    return res.status(200).json({
      success: true,
      message: "Bookmarks fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getBookmarkById = async (req, res, next) => {
  try {
    const bookmark = await courseVideoBookmarkService.getBookmarkById(req);
    return res.status(200).json({
      success: true,
      message: "Bookmark fetched successfully!",
      bookmark,
    });
  } catch (error) {
    next(error);
  }
};

const updateBookmark = async (req, res, next) => {
  try {
    const bookmark = await courseVideoBookmarkService.updateBookmark(req);
    return res.status(200).json({
      success: true,
      message: "Bookmark updated successfully!",
      bookmark,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBookmark = async (req, res, next) => {
  try {
    const bookmark = await courseVideoBookmarkService.deleteBookmark(req);
    return res.status(200).json({
      success: true,
      message: "Bookmark removed successfully!",
      bookmark,
    });
  } catch (error) {
    next(error);
  }
};

export const courseVideoBookmarkController = {
  addBookmark,
  getMyBookmarks,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
};
