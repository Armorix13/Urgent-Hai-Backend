import { apiFetch } from "@/lib/api";

export type CourseSummary = {
  _id: string;
  title?: string;
  identifierId?: string | null;
  thumbnail?: string | null;
  category?: string | null;
  isDeleted?: boolean;
};

export type BookmarkCourseVideo = {
  _id: string;
  videoUrl?: string | null;
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  courseId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CourseVideoBookmarkRow = {
  _id: string;
  userId: string | null;
  note?: string;
  courseVideo: BookmarkCourseVideo | null;
  course: CourseSummary | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BookmarksListResponse = {
  success: boolean;
  message?: string;
  bookmarks: CourseVideoBookmarkRow[];
  total: number;
  page: number;
  totalPages: number;
};

export type BookmarkMutationResponse = {
  success: boolean;
  message?: string;
  alreadyBookmarked?: boolean;
  bookmark: CourseVideoBookmarkRow;
};

const qs = (q: Record<string, number | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && !Number.isNaN(v)) p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

/** GET /course-video-bookmarks — current user’s bookmarks (paginated). */
export function fetchMyCourseVideoBookmarks(params?: { page?: number; limit?: number }) {
  return apiFetch<BookmarksListResponse>(
    `/course-video-bookmarks${qs({ page: params?.page, limit: params?.limit })}`,
  );
}

/** POST /course-video-bookmarks — bookmark a CourseVideo by id. */
export function createCourseVideoBookmark(body: { courseVideoId: string; note?: string }) {
  return apiFetch<BookmarkMutationResponse>("/course-video-bookmarks", { method: "POST", json: body });
}

export function fetchCourseVideoBookmarkById(id: string) {
  return apiFetch<{ success: boolean; bookmark: CourseVideoBookmarkRow }>(
    `/course-video-bookmarks/${id}`,
  );
}

export function updateCourseVideoBookmark(id: string, body: { note: string }) {
  return apiFetch<{ success: boolean; bookmark: CourseVideoBookmarkRow }>(
    `/course-video-bookmarks/${id}`,
    { method: "PUT", json: body },
  );
}

export function deleteCourseVideoBookmark(id: string) {
  return apiFetch<{ success: boolean; bookmark: CourseVideoBookmarkRow }>(
    `/course-video-bookmarks/${id}`,
    { method: "DELETE" },
  );
}
