import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import {
  PUBLIC_USER_SELECT,
  enrichPopulatedUserFieldAndSplit,
  getPublicUserById,
} from "../utils/userPublic.util.js";

const MAX_SEARCH_LEN = 200;

function viewerFromReq(req) {
  return {
    authKind: req.authKind,
    userId: req.userId ?? null,
  };
}

/** @param {object} doc — Mongoose doc with `.toObject()` or plain */
function formatProductDTO(doc, viewer) {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const enriched = enrichPopulatedUserFieldAndSplit(plain, "userId");
  const vid =
    viewer?.authKind === "user" && viewer?.userId != null ? String(viewer.userId) : "";
  const ownerRaw = enriched?.userId;
  let ownerId = "";
  if (typeof ownerRaw === "string" && ownerRaw) ownerId = ownerRaw;
  else if (enriched?.user?._id != null) ownerId = String(enriched.user._id);
  else if (ownerRaw != null) ownerId = String(ownerRaw);
  const isCreatedByMe = Boolean(vid && ownerId && vid === ownerId);
  return { ...enriched, isCreatedByMe };
}

function assertLearner(req) {
  if (req.authKind !== "user" || !req.userId) {
    const err = new Error("Only learner accounts can manage owned products.");
    err.statusCode = 403;
    throw err;
  }
}

async function assertProductOwnedByLearner(req, productId) {
  assertLearner(req);
  const row = await Product.findById(productId).select("userId").lean();
  if (!row) {
    throw new Error("Product not found");
  }
  if (!row.userId) {
    const err = new Error("This product has no owner and cannot be modified via the API.");
    err.statusCode = 403;
    throw err;
  }
  if (String(row.userId) !== String(req.userId)) {
    const err = new Error("You can only modify your own products.");
    err.statusCode = 403;
    throw err;
  }
}

function populateProduct(q) {
  return q
    .populate("category", "name")
    .populate({ path: "userId", select: PUBLIC_USER_SELECT });
}

/** In-place Fisher-Yates shuffle. */
function shuffleArrayInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadProductsInOrder(orderedIds) {
  if (!orderedIds.length) return [];
  const byId = await populateProduct(Product.find({ _id: { $in: orderedIds } }));
  const map = new Map(byId.map((p) => [p._id.toString(), p]));
  return orderedIds.map((id) => map.get(id.toString())).filter(Boolean);
}

/** Escape user input for safe use in MongoDB `$regexMatch` / `RegExp`. */
function escapeRegexForSearch(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Add a new product (authenticated learner only; userId set from JWT)
const addProduct = async (req) => {
  assertLearner(req);
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

  const created = await Product.create({
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
    userId: req.userId,
  });

  const full = await populateProduct(Product.findById(created._id));
  if (!full) {
    throw new Error("Product not found");
  }
  return formatProductDTO(full, viewerFromReq(req));
};

// Get all products with optional pagination
const getAllProducts = async (req) => {
  const viewer = viewerFromReq(req);
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const rawSearch = req.query.search;
  const searchTrimmed =
    rawSearch != null && String(rawSearch).trim() !== ""
      ? String(rawSearch).trim().slice(0, MAX_SEARCH_LEN)
      : "";

  const categoryId =
    req.query.categoryId != null && String(req.query.categoryId).trim() !== ""
      ? String(req.query.categoryId).trim()
      : null;
  const categoryMatch = categoryId ? { category: new mongoose.Types.ObjectId(categoryId) } : null;

  let searchMatch = null;
  let categoryIdsForSearch = [];

  if (searchTrimmed) {
    const escaped = escapeRegexForSearch(searchTrimmed);
    const re = new RegExp(escaped, "i");
    const cats = await Category.find({
      $or: [{ name: re }, { description: re }],
    })
      .select("_id")
      .lean();
    categoryIdsForSearch = cats.map((c) => c._id);
    searchMatch = {
      $or: [
        { name: re },
        { description: re },
        { tags: re },
        { contact: re },
        ...(categoryIdsForSearch.length ? [{ category: { $in: categoryIdsForSearch } }] : []),
      ],
    };
  }

  const onlyMyProducts =
    req.query.onlyMyProducts === true ||
    req.query.onlyMyProducts === 1 ||
    String(req.query.onlyMyProducts ?? "")
      .trim()
      .toLowerCase() === "true";

  let myProductsMatch = null;
  if (onlyMyProducts) {
    if (req.authKind === "user" && req.userId) {
      myProductsMatch = { userId: new mongoose.Types.ObjectId(req.userId) };
    } else {
      /** Learner JWT required for “mine”; collaborators / missing user → empty list. */
      myProductsMatch = { _id: { $in: [] } };
    }
  }

  const matchClauses = [];
  if (searchMatch) matchClauses.push(searchMatch);
  if (categoryMatch) matchClauses.push(categoryMatch);
  if (myProductsMatch) matchClauses.push(myProductsMatch);

  let matchQuery = {};
  if (matchClauses.length === 1) {
    matchQuery = matchClauses[0];
  } else if (matchClauses.length > 1) {
    matchQuery = { $and: matchClauses };
  }

  const total = await Product.countDocuments(matchQuery);

  // Always random order for list API.
  const idRows = await Product.find(matchQuery).select("_id").lean();
  const ids = idRows.map((r) => r._id);
  shuffleArrayInPlace(ids);
  const pageIds = ids.slice(skip, skip + limit);
  const products = await loadProductsInOrder(pageIds);

  return {
    products: products.map((p) => formatProductDTO(p, viewer)),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 0,
  };
};

// Get single product by ID
const getProductById = async (req) => {
  const product = await populateProduct(Product.findById(req.params.id));

  if (!product) {
    throw new Error("Product not found");
  }

  return formatProductDTO(product, viewerFromReq(req));
};

// Update product by ID (owner only)
const updateProduct = async (req) => {
  await assertProductOwnedByLearner(req, req.params.id);
  const updates = { ...req.body };

  const updated = await populateProduct(
    Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }),
  );

  if (!updated) {
    throw new Error("Product not found");
  }

  return formatProductDTO(updated, viewerFromReq(req));
};

// Delete product by ID (owner only)
const deleteProduct = async (req) => {
  assertLearner(req);
  const { id } = req.params;

  const deleted = await Product.findOneAndDelete({ _id: id, userId: req.userId });

  if (!deleted) {
    const exists = await Product.exists({ _id: id });
    if (!exists) {
      throw new Error("Product not found");
    }
    const err = new Error("You can only delete your own products.");
    err.statusCode = 403;
    throw err;
  }

  const plain = deleted.toObject();
  const user = plain.userId ? await getPublicUserById(plain.userId) : null;
  const synthetic = enrichPopulatedUserFieldAndSplit(
    { ...plain, userId: user },
    "userId",
  );
  return { ...synthetic, isCreatedByMe: true };
};

export const productService = {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
