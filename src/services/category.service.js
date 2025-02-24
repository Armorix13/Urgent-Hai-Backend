import Category from "../models/category.model.js";


const addCategory = async (req) => {
    try {
        const { name, description, image } = req.body;
        const category = await Category.create({
            name,
            description,
            image
        });
        return category;
    } catch (error) {
        throw error;
    }
}
const updateCategory = async (req) => {
    try {
        const id = req.params.id;

        const { name, description, image } = req.body;
        const category = await Category.findById(id);

        if (!category) {
            throw new Error("category not found");
        }

        if (name) category.name = name;
        if (description) category.description = description;
        if (image) category.image = image;

        return category;
    } catch (error) {
        throw error;
    }
}

const deleteCategory = async (req) => {
    try {
        const id = req.params.id;
        const category = await Category.findById(id);

        if (!category) {
            throw new Error("category not found");
        }
        await Category.findByIdAndDelete(id);
        return;
    } catch (error) {
        throw error;
    }
}

const getAllCategory = async (req) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const categories = await Category.find()
            .skip((page - 1) * limit)
            .limit(limit);

        const totalCategories = await Category.countDocuments();

        return {
            categories,
            totalCategories,
            totalPages: Math.ceil(totalCategories / limit),
            currentPage: page,
        };
    } catch (error) {
        throw error;
    }
}

export const categoryService = {
    addCategory,
    updateCategory,
    getAllCategory,
    deleteCategory
}