import { productService } from "../services/product.service.js";

const addProduct = async (req, res, next) => {
  try {
    const product = await productService.addProduct(req);
    return res.status(201).json({
      success: true,
      message: "Product created successfully!",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const data = await productService.getAllProducts(req);
    return res.status(200).json({
      success: true,
      message: "Products fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req);
    return res.status(200).json({
      success: true,
      message: "Product fetched successfully!",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req);
    return res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req);
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully!",
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const productController = {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
