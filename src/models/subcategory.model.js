import mongoose from "mongoose";
const Schema = mongoose.Schema;

const subcategorySchema = new Schema({
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    image: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);
const Subcategory =  mongoose.model("Subcategory", subcategorySchema);
export default Subcategory;
