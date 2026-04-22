import { apiFetch } from "@/lib/api";

export type MyRating = {
  rating: number;
  review: string;
  updatedAt?: string;
};

export type EnrollmentCourse = {
  _id: string;
  title: string;
  thumbnail?: string | null;
  category?: string;
  rating?: { average?: number; count?: number };
};

export type EnrollmentRow = {
  _id: string;
  course?: EnrollmentCourse;
  myRating?: MyRating | null;
  enrolledAt?: string;
  expiresAt?: string | null;
  enrollmentType?: "free" | "paid";
  progress?: {
    completedLessonOrders?: number[];
    lastAccessedAt?: string;
    completionPercentage?: number;
  };
  paymentDetails?: {
    amount?: number;
    paymentMethod?: string | null;
    transactionId?: string | null;
    paymentDate?: string | null;
  };
};

export type EnrollmentsResponse = {
  success: boolean;
  enrollments: EnrollmentRow[];
};

export function fetchMyEnrollments() {
  return apiFetch<EnrollmentsResponse>("/enrollment/");
}
