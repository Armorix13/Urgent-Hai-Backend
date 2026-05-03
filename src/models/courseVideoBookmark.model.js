import mongoose from "mongoose";

const courseVideoBookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },
  },
  { timestamps: true }
);

courseVideoBookmarkSchema.index({ userId: 1, updatedAt: -1 });

const CourseVideoBookmark = mongoose.model("CourseVideoBookmark", courseVideoBookmarkSchema);

export default CourseVideoBookmark;
