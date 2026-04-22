import { apiFetch } from "@/lib/api";

/** 1 = paid, 2 = free (matches backend `course.courseType`) */
export type CourseTypeNum = 1 | 2;

export type CourseContentItem = {
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: string;
  order?: number;
  isPreview?: boolean;
};

/** Inline videos for `POST/PUT /course` (`videoUrl` or `video_url`). */
export type CourseVideoInlineItem = {
  videoUrl?: string;
  video_url?: string;
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
};

export type CourseContentRow = CourseContentItem & { _id?: string };

export type CourseVideoRow = {
  _id?: string;
  videoUrl?: string | null;
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
};

export type CourseCollaboratorRef =
  | string
  | {
      _id: string;
      name?: string;
      email?: string;
      profile?: string;
    }
  | null
  | undefined;

export type CourseRatingSummary = {
  average: number;
  count: number;
};

export type CourseRatingEntry = {
  _id: string;
  rating: number;
  review?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    _id?: string;
    userName?: string | null;
    profileImage?: string | null;
  } | null;
};

export type Course = {
  _id: string;
  title: string;
  identifierId?: string | null;
  description?: string;
  courseType: CourseTypeNum;
  courseTypeName?: string;
  price?: number;
  benefits?: string[];
  category: string;
  thumbnail?: string | null;
  duration?: string;
  level?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  isActive?: boolean;
  isDeleted?: boolean;
  enrollmentCount?: number;
  rating?: CourseRatingSummary;
  collaborators?: CourseCollaboratorRef;
  courseContent?: CourseContentRow[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  videos?: CourseVideoRow[];
  videoCount?: number;
  /** Recent reviews (from `GET /course/:id`). */
  courseRatings?: CourseRatingEntry[];
  /** Present when request is authenticated as a student user. */
  isEnrolled?: boolean;
  myRating?: {
    rating: number;
    review?: string;
    updatedAt?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Pagination = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCourses: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type CoursesListResponse = {
  success: boolean;
  courses: Course[];
  pagination: Pagination | null;
};

export type CourseResponse = {
  success: boolean;
  course: Course;
};

const qs = (q: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === "") return;
    if (typeof v === "boolean") {
      p.set(k, v ? "true" : "false");
      return;
    }
    p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

/**
 * Admin-style list (inactive + soft-deleted included). Default: full list (mobile-safe).
 * Opt-in: `mine: true` + collaborator JWT → only that collaborator’s courses (`collaborators` match).
 */
export function fetchCoursesAdmin(params: {
  page?: number;
  limit?: number;
  search?: string;
  courseType?: CourseTypeNum;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  mine?: boolean;
}) {
  return apiFetch<CoursesListResponse>(`/course/admin/all${qs(params)}`);
}

export function fetchCourseById(id: string) {
  return apiFetch<CourseResponse>(`/course/${id}`);
}

/** Body for `POST /api/v1/course` — matches backend `addCourseSchema` + `collaboratorId`. */
export type AddCourseBody = {
  title: string;
  identifierId?: string | null;
  /** Maps to course `collaborators` ref on the server. */
  collaboratorId?: string | null;
  description: string;
  courseType: CourseTypeNum;
  price?: number;
  benefits?: string[];
  category: string;
  thumbnail?: string | null;
  duration?: string;
  level?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  courseContent?: CourseContentItem[];
  videos?: CourseVideoInlineItem[];
  isActive?: boolean;
};

export function createCourse(body: AddCourseBody) {
  return apiFetch<CourseResponse>("/course", { method: "POST", json: body });
}

export function updateCourse(
  id: string,
  body: Partial<AddCourseBody> & { isDeleted?: boolean },
) {
  return apiFetch<CourseResponse>(`/course/${id}`, { method: "PUT", json: body });
}

export function deleteCourse(id: string) {
  return apiFetch<CourseResponse>(`/course/${id}`, { method: "DELETE" });
}
