import Category from "../models/category.model.js";

// Add a new category
const addCategory = async (req) => {
  try {
    const { name, description, image } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      throw new Error("Category already exists");
    }

    const category = await Category.create({ name, description, image });
    return category;
  } catch (err) {
    throw err;
  }
};

// Get all categories with optional pagination
const getAllCategories = async (req) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * limit;

    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments();

    return {
      categories,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    throw err;
  }
};

// Update category
const updateCategory = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Category.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updated) {
      throw new Error("Category not found");
    }

    return updated;
  } catch (err) {
    throw err;
  }
};

// Delete category
const deleteCategory = async (req) => {
  try {
    const { id } = req.params;

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      throw new Error("Category not found");
    }

    return deleted;
  } catch (err) {
    throw err;
  }
};

export const categoryService = {
  addCategory,
  deleteCategory,
  updateCategory,
  getAllCategories,
};
