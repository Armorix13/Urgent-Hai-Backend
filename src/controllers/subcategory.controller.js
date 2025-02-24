import { subcategoryService } from "../services/subcategory.service.js";

const addSubCategory=async(req,res,next)=>{
    try {
     const subcategory = await subcategoryService.addSubCategory(req);
     return res.status(200).json({
        success:true,
        message:"subcategory added successfully",
        subcategory
     })   
    } catch (error) {
    next(error); 
    }
}

const updateSubCategory=async(req,res,next)=>{
    try {
     const subcategory = await subcategoryService.updateSubCategory(req);
     return res.status(200).json({
        success:true,
        message:"subcategory updated successfully",
        subcategory
     })   
    } catch (error) {
    next(error); 
    }
}

const deleteSubCategory=async(req,res,next)=>{
    try {
    await subcategoryService.deleteSubCategory(req);
     return res.status(200).json({
        success:true,
        message:"subcategory deleted successfully",
     })   
    } catch (error) {
    next(error); 
    }
}

const getAllSubCategory=async(req,res,next)=>{
    try {
     const result = await subcategoryService.getAllSubCategory(req);
     return res.status(200).json({
        success:true,
        message:"all subcategory fetched successfully",
        result
     })   
    } catch (error) {
    next(error); 
    }
}

export const subcategoryController = {
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    getAllSubCategory
}