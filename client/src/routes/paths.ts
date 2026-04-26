/** Single source of truth for URL paths — use in links, redirects, and navigation config */

const D = "/dashboard";

export const ROUTES = {
  root: "/",
  login: "/login",
  dashboard: {
    home: D,
    course: `${D}/course`,
    courseNew: `${D}/course/new`,
    suggestion: `${D}/suggestion`,
    rating: `${D}/rating`,
    settings: `${D}/settings`,
  },
} as const;

/** Login URL for full page navigation (matches Vite `base` / router `basename`). */
export function loginPagePath(): string {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const login = ROUTES.login.startsWith("/") ? ROUTES.login : `/${ROUTES.login}`;
  const path = `${base}${login}`;
  return path.replace(/([^:]\/)\/+/g, "$1") || "/login";
}

export function courseDetailPath(id: string) {
  return `${D}/course/${id}`;
}

export function courseEditPath(id: string) {
  return `${D}/course/${id}/edit`;
}

export type DashboardPath =
  (typeof ROUTES.dashboard)[keyof typeof ROUTES.dashboard];
