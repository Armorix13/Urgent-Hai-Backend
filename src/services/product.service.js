import Product from "../models/product.model.js";

// Add a new product
const addProduct = async (req) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      images,
      category,
      stock,
      tags,
      isFeatured,
      isActive,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      images,
      category,
      stock,
      tags,
      isFeatured,
      isActive,
    });

    return product;
  } catch (error) {
    throw error;
  }
};

// Get all products with optional pagination
const getAllProducts = async (req) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate("category", "name") // populate category name
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw error;
  }
};

// Get single product by ID
const getProductById = async (req) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "category",
      "name description image"
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  } catch (error) {
    throw error;
  }
};

// Update product by ID
const updateProduct = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Product.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updated) {
      throw new Error("Product not found");
    }

    return updated;
  } catch (error) {
    throw error;
  }
};

// Delete product by ID
const deleteProduct = async (req) => {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      throw new Error("Product not found");
    }

    return deleted;
  } catch (error) {
    throw error;
  }
};

export const productService = {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
