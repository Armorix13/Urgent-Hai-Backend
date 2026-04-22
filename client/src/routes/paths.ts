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

export function courseDetailPath(id: string) {
  return `${D}/course/${id}`;
}

export function courseEditPath(id: string) {
  return `${D}/course/${id}/edit`;
}

export type DashboardPath =
  (typeof ROUTES.dashboard)[keyof typeof ROUTES.dashboard];
