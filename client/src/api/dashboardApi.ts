import { apiFetch } from "@/lib/api";

export type DashboardCourseStats = {
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
};

/** Returned when `authKind === "collaborator"` — only courses where `course.collaborators` matches your login id. */
export type DashboardMineStats = DashboardCourseStats & {
  coursesAddedToday: number;
  coursesAddedThisWeek: number;
  coursesAddedThisMonth: number;
  ratingsReceived: number;
  ratingsAverage: number;
};

export type TrendPoint = { date: string; count: number };

export type DashboardEnrollmentRow = {
  _id: string;
  enrolledAt?: string;
  course?: {
    _id: string;
    title: string;
    category?: string;
    thumbnail?: string | null;
  } | null;
  user?: { userName?: string | null; profileImage?: string | null } | null;
};

export type DashboardRatingRow = {
  _id: string;
  rating: number;
  review?: string;
  updatedAt?: string;
  course?: { _id: string; title: string; category?: string } | null;
  user?: { userName?: string | null; profileImage?: string | null } | null;
};

export type TopRatedCourse = {
  _id: string;
  title: string;
  category?: string;
  rating?: { average?: number; count?: number };
  enrollmentCount: number;
  thumbnail?: string | null;
};

export type DashboardAnalyticsResponse = {
  success: boolean;
  message?: string;
  authKind: "user" | "collaborator";
  /** Platform-wide stats (always present for mobile compatibility; web may hide for collaborators). */
  platform: DashboardCourseStats;
  /** Populated for collaborators; always `null` for learner (`user`) tokens. */
  mine: DashboardMineStats | null;
  enrollmentTrend: {
    platform: TrendPoint[];
    mine: TrendPoint[] | null;
  };
  recentEnrollments: DashboardEnrollmentRow[];
  recentRatings: DashboardRatingRow[];
  topRatedCourses: TopRatedCourse[];
};

export function fetchDashboardAnalytics() {
  return apiFetch<DashboardAnalyticsResponse>("/dashboard/analytics");
}
