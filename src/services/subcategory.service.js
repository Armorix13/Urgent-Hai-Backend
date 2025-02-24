import Subcategory from "../models/subcategory.model.js";


const addSubCategory = async (req) => {
    try {
        const { name, description, image, categoryId } = req.body;
        const subcategory = await Subcategory.create({
            name,
            description,
            image,
            categoryId
        });
        return subcategory;
    } catch (error) {
        throw error;
    }
}
const updateSubCategory = async (req) => {
    try {
        const id = req.params.id;

        const { name, description, image, categoryId } = req.body;
        const subcategory = await Subcategory.findById(id);

        if (!subcategory) {
            throw new Error("category not found");
        }

        if (name) subcategory.name = name;
        if (description) subcategory.description = description;
        if (image) subcategory.image = image;
        if (categoryId) subcategory.categoryId = categoryId;


        return subcategory;
    } catch (error) {
        throw error;
    }
}

const deleteSubCategory = async (req) => {
    try {
        const id = req.params.id;
        const subcategory = await Subcategory.findById(id);

        if (!subcategory) {
            throw new Error("category not found");
        }
        await Subcategory.findByIdAndDelete(id);
        return;
    } catch (error) {
        throw error;
    }
}

const getAllSubCategory = async (req) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const subcategories = await Subcategory.find()
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('categoryId'); 

        const totalSubCategories = await Subcategory.countDocuments();

        return {
            subcategories,
            totalSubCategories,
            totalPages: Math.ceil(totalSubCategories / limit),
            currentPage: page,
        };
    } catch (error) {
        throw error;
    }
}


export const subcategoryService = {
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getAllSubCategory
}