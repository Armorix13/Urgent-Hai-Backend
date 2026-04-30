import { apiFetch } from "@/lib/api";

export type CategoryDoc = {
  _id: string;
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoriesListResponse = {
  success: boolean;
  message?: string;
  categories: CategoryDoc[];
  total: number;
  page: number;
  totalPages: number;
};

export type CategoryMutationResponse = {
  success: boolean;
  message?: string;
  category: CategoryDoc;
};

export type AddCategoryBody = {
  name: string;
  description?: string;
  image?: string;
};

export type UpdateCategoryBody = {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
};

const qs = (q: Record<string, number | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && !Number.isNaN(v)) {
      p.set(k, String(v));
    }
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

/** GET /category — optional pagination (defaults page 1, limit 10 on server). */
export function fetchCategories(params?: { page?: number; limit?: number }) {
  const suffix = qs({
    page: params?.page,
    limit: params?.limit,
  });
  return apiFetch<CategoriesListResponse>(`/category${suffix}`);
}

/** POST /category — `name` required (3–50 chars); Bearer required. */
export function createCategory(body: AddCategoryBody) {
  return apiFetch<CategoryMutationResponse>("/category", { method: "POST", json: body });
}

/** PUT /category/:id — partial update; Bearer required. */
export function updateCategory(id: string, body: UpdateCategoryBody) {
  return apiFetch<CategoryMutationResponse>(`/category/${id}`, { method: "PUT", json: body });
}

/** DELETE /category/:id — Bearer required. */
export function deleteCategory(id: string) {
  return apiFetch<CategoryMutationResponse>(`/category/${id}`, { method: "DELETE" });
}
