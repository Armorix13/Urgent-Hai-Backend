import { categoryService } from "../services/category.service.js";

const addCategory = async (req, res, next) => {
    try {
        const category = await categoryService.addCategory(req);
        return res.status(200).json({
            success:true,
            message: "Category added successfully",
            category
        });
    } catch (error) {
        next(error)
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const category = await categoryService.updateCategory(req);
        return res.status(200).json({
            success:true,
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        next(error)
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req);
        return res.status(200).json({
            success:true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        next(error)
    }
};

const getAllCategory = async (req, res, next) => {
    try {
        const result = await categoryService.getAllCategory(req);
        return res.status(200).json({
            success:true,
            message:"all category fetched successfully",
            result
        });
    } catch (error) {
        next(error)
    }
};

export const categoryController = {
    addCategory,
    updateCategory,
    deleteCategory,
    getAllCategory
};
