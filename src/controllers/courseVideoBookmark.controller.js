import { courseVideoBookmarkService } from "../services/courseVideoBookmark.service.js";

const addBookmark = async (req, res, next) => {
  try {
    const bookmark = await courseVideoBookmarkService.createBookmark(req);
    return res.status(201).json({
      success: true,
      message: "Bookmark added successfully!",
      bookmark,
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
  deleteBookmark,
};
