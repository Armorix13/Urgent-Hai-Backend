import mongoose from "mongoose";
const Schema = mongoose.Schema;

const productSchema = new Schema(
    {
        name: {
            type: String
        },
        description: {
            type: String
        },
        price: {
            type: Number
        },
        quantity: {
            type: Number
        },
        imageUrls: [
            {
                type: String,
            },
        ],
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
        },
        subcategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subcategory"
        },
        brand: {
            type: String
        },
        weight: {
            type: Number,
        },
        unit: {
            type: String, // e.g., kg, gm, ltr, etc.
        },
        discount: {
            type: Number, // in percentage (0-100)
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);


const Product = mongoose.model("Product", productSchema);

export default Product;
