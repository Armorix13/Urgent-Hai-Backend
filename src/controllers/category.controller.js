import { categoryService } from "../services/category.service.js";

const addCategory = async (req, res, next) => {
  try {
    const category = await categoryService.addCategory(req);
    return res.status(201).json({
      success: true,
      message: "Category created successfully!",
      category,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getAllCategories(req);
    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req);
    return res.status(200).json({
      success: true,
      message: "Category updated successfully!",
      category,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await categoryService.deleteCategory(req);
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully!",
      category,
    });
  } catch (error) {
    next(error);
  }
};

export const categoryController = {
  addCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
