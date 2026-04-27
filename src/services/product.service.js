import Product from "../models/product.model.js";
import Category from "../models/category.model.js";

const MAX_SEARCH_LEN = 200;

/** Escape user input for safe use in MongoDB `$regexMatch` / `RegExp`. */
function escapeRegexForSearch(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const rawSearch = req.query.search;
    const searchTrimmed =
      rawSearch != null && String(rawSearch).trim() !== ""
        ? String(rawSearch).trim().slice(0, MAX_SEARCH_LEN)
        : "";

    let matchQuery = {};
    let searchPattern = "";
    let categoryIdsForSearch = [];

    if (searchTrimmed) {
      searchPattern = escapeRegexForSearch(searchTrimmed);
      const re = new RegExp(searchPattern, "i");
      const cats = await Category.find({
        $or: [{ name: re }, { description: re }],
      })
        .select("_id")
        .lean();
      categoryIdsForSearch = cats.map((c) => c._id);
      matchQuery = {
        $or: [
          { name: re },
          { description: re },
          { tags: re },
          { contact: re },
          ...(categoryIdsForSearch.length ? [{ category: { $in: categoryIdsForSearch } }] : []),
        ],
      };
    }

    const total = await Product.countDocuments(matchQuery);

    let products;
    if (searchTrimmed) {
      const pattern = searchPattern;
      const rankExpr = {
        $cond: [
          {
            $regexMatch: {
              input: { $toString: { $ifNull: ["$name", ""] } },
              regex: pattern,
              options: "i",
            },
          },
          1,
          {
            $cond: [
              {
                $regexMatch: {
                  input: { $toString: { $ifNull: ["$description", ""] } },
                  regex: pattern,
                  options: "i",
                },
              },
              2,
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ["$tags", []] },
                            as: "t",
                            cond: {
                              $regexMatch: {
                                input: { $toString: "$$t" },
                                regex: pattern,
                                options: "i",
                              },
                            },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  3,
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: { $toString: { $ifNull: ["$contact", ""] } },
                          regex: pattern,
                          options: "i",
                        },
                      },
                      4,
                      {
                        $cond: [
                          {
                            $and: [
                              { $ne: [{ $ifNull: ["$category", null] }, null] },
                              { $in: ["$category", categoryIdsForSearch] },
                            ],
                          },
                          5,
                          6,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const pipeline = [
        { $match: matchQuery },
        { $addFields: { _searchRank: rankExpr } },
        { $sort: { _searchRank: 1, createdAt: -1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { _searchRank: 0 } },
      ];

      const ordered = await Product.aggregate(pipeline);
      const ids = ordered.map((d) => d._id);
      if (!ids.length) {
        products = [];
      } else {
        const byId = await Product.find({ _id: { $in: ids } }).populate("category", "name");
        const map = new Map(byId.map((p) => [p._id.toString(), p]));
        products = ids.map((id) => map.get(id.toString())).filter(Boolean);
      }
    } else {
      products = await Product.find(matchQuery)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 0,
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
