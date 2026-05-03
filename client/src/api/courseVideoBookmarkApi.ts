import { apiFetch } from "@/lib/api";

export type CourseVideoBookmarkRow = {
  _id: string;
  userId: string | null;
  title: string;
  videoUrl: string;
  description: string;
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

export type AddBookmarkResponse = {
  success: boolean;
  message?: string;
  bookmark: CourseVideoBookmarkRow;
};

export type DeleteBookmarkResponse = {
  success: boolean;
  message?: string;
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

/** POST /course-video-bookmarks — `userId` is taken from the JWT. */
export function createCourseVideoBookmark(body: {
  title: string;
  videoUrl: string;
  description?: string;
}) {
  return apiFetch<AddBookmarkResponse>("/course-video-bookmarks", { method: "POST", json: body });
}

export function deleteCourseVideoBookmark(id: string) {
  return apiFetch<DeleteBookmarkResponse>(`/course-video-bookmarks/${id}`, { method: "DELETE" });
}
