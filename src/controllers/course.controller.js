import { courseService } from "../services/course.service.js";

const addCourse = async (req, res, next) => {
  try {
    const course = await courseService.addCourse(req);
    return res.status(201).json({
      success: true,
      message: "Course created successfully!",
      course,
    });
  } catch (error) {
    next(error);
  }
};

const getCourses = async (req, res, next) => {
  try {
    const { courses, pagination, totalVideosOnPage } =
      await courseService.getCoursesWithPagination(req);
    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully!",
      courses: courses ?? [],
      pagination: pagination ?? null,
      totalVideosOnPage: totalVideosOnPage ?? 0,
    });
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req);
    return res.status(200).json({
      success: true,
      message: "Course fetched successfully!",
      course,
    });
  } catch (error) {
    next(error);
  }
};

const getSimilarCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getSimilarCourses(req);
    return res.status(200).json({
      success: true,
      message: "Similar courses fetched successfully!",
      courses,
    });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req);
    return res.status(200).json({
      success: true,
      message: "Course updated successfully!",
      course,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await courseService.deleteCourse(req);
    return res.status(200).json({
      success: true,
      message: "Course deleted (soft) successfully!",
      course,
    });
  } catch (error) {
    next(error);
  }
};

const hardDeleteCourse = async (req, res, next) => {
  try {
    const course = await courseService.hardDeleteCourse(req);
    return res.status(200).json({
      success: true,
      message: "Course deleted successfully!",
      course,
    });
  } catch (error) {
    next(error);
  }
};

export const courseController = {
  addCourse,
  getCourses,
  getCourseById,
  getSimilarCourses,
  updateCourse,
  deleteCourse,
  hardDeleteCourse,
};
