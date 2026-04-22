import { apiFetch } from "@/lib/api";

export type SuggestionPublicUser = {
  _id: string;
  userName?: string;
  email?: string;
  profileImage?: string | null;
  roleName?: string;
};

export type SuggestionRow = {
  _id: string;
  userId: string;
  user: SuggestionPublicUser | null;
  title: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SuggestionPagination = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type SuggestionAnalytics = {
  totalSuggestions: number;
  submittedLast7Days: number;
  submittedLast30Days: number;
  uniqueContributors: number;
};

export type ListSuggestionsResponse = {
  success: boolean;
  message?: string;
  suggestions: SuggestionRow[];
  pagination?: SuggestionPagination | null;
  analytics?: SuggestionAnalytics;
  search?: string | null;
};

export type SuggestionMutationResponse = {
  success: boolean;
  message?: string;
  suggestion: SuggestionRow;
};

export function fetchSuggestions(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 12;
  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const s = params?.search?.trim();
  if (s) q.set("search", s);
  return apiFetch<ListSuggestionsResponse>(`/suggestion?${q.toString()}`);
}

export function createSuggestion(body: { title: string; description: string }) {
  return apiFetch<SuggestionMutationResponse>("/suggestion", {
    method: "POST",
    json: body,
  });
}

export function updateSuggestion(
  id: string,
  body: { title?: string; description?: string },
) {
  return apiFetch<SuggestionMutationResponse>(`/suggestion/${id}`, {
    method: "PUT",
    json: body,
  });
}

export function deleteSuggestion(id: string) {
  return apiFetch<{ success: boolean; message?: string }>(`/suggestion/${id}`, {
    method: "DELETE",
  });
}
