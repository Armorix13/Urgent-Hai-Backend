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

/** Old schema had a unique (userId, courseVideoId); without courseVideoId, Mongo treats null and blocks multiple rows per user. Drop legacy indexes after connect. */
async function dropLegacyBookmarkIndexes() {
  try {
    await CourseVideoBookmark.syncIndexes();
  } catch (e) {
    console.warn("[CourseVideoBookmark] syncIndexes:", e?.message || e);
  }
  const legacyNames = ["userId_1_courseVideoId_1"];
  for (const name of legacyNames) {
    try {
      await CourseVideoBookmark.collection.dropIndex(name);
      console.log(`[CourseVideoBookmark] dropped legacy index: ${name}`);
    } catch {
      // index not present
    }
  }
}

function scheduleBookmarkIndexCleanup() {
  const run = () => void dropLegacyBookmarkIndexes();
  if (mongoose.connection.readyState === 1) run();
  else mongoose.connection.once("open", run);
}

scheduleBookmarkIndexCleanup();

export default CourseVideoBookmark;
