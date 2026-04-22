import { apiFetch } from "@/lib/api";

export type SubmitRatingBody = {
  rating: number;
  review?: string;
};

export type SubmitRatingResponse = {
  success: boolean;
  message?: string;
  data: {
    courseId: string;
    rating: number;
    review: string;
    updatedAt?: string;
  };
};

export function submitCourseRating(courseId: string, body: SubmitRatingBody) {
  return apiFetch<SubmitRatingResponse>(`/rating/${courseId}`, {
    method: "POST",
    json: body,
  });
}

// —— Collaborator: ratings & reviews on owned courses ——

export type StarDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type CollaboratorRatingOverview = {
  totalReviews: number;
  averageRating: number;
  coursesWithReviews: number;
  totalCourses: number;
  distribution: StarDistribution;
};

export type CollaboratorCourseRow = {
  _id: string;
  title: string;
  category: string;
  thumbnail?: string | null;
  identifierId?: string | null;
  isActive: boolean;
  rating: { average?: number; count?: number };
};

export type ReviewsPagination = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type CollaboratorReviewRow = {
  _id: string;
  rating: number;
  review: string;
  createdAt?: string;
  updatedAt?: string;
  user: {
    _id: string;
    userName?: string | null;
    profileImage?: string | null;
  } | null;
};

export async function fetchCollaboratorRatingOverview() {
  const res = await apiFetch<{
    success: boolean;
    message?: string;
    data: CollaboratorRatingOverview;
  }>("/rating/collaborator/overview");
  return res.data;
}

export async function fetchCollaboratorRatingCourses(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.search != null && params.search.trim() !== "") q.set("search", params.search.trim());
  const qs = q.toString();
  return apiFetch<{
    success: boolean;
    courses: CollaboratorCourseRow[];
    pagination: ReviewsPagination;
  }>(`/rating/collaborator/courses${qs ? `?${qs}` : ""}`);
}

export async function fetchCollaboratorCourseReviews(
  courseId: string,
  params: { page?: number; limit?: number },
) {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiFetch<{
    success: boolean;
    course: {
      _id: string;
      title: string;
      category?: string;
      rating?: { average?: number; count?: number };
    };
    summary: {
      averageRating: number;
      totalReviews: number;
      distribution: StarDistribution;
    };
    reviews: CollaboratorReviewRow[];
    pagination: ReviewsPagination;
  }>(`/rating/collaborator/course/${courseId}/reviews${qs ? `?${qs}` : ""}`);
}

export async function deleteCollaboratorReview(ratingId: string) {
  return apiFetch<{
    success: boolean;
    message?: string;
    data: { deleted: boolean; courseId: string };
  }>(`/rating/collaborator/review/${ratingId}`, { method: "DELETE" });
}
