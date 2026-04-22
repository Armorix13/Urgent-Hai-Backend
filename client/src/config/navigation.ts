/**
 * Sidebar navigation — edit `sidebarNav` to add/remove items or sections.
 * Paths should match `ROUTES` in `src/routes/paths.ts`.
 */

import { ROUTES } from "../routes/paths";

export type SidebarIconId =
  | "dashboard"
  | "course"
  | "suggestion"
  | "rating"
  | "settings";

export type SidebarNavItem = {
  id: string;
  label: string;
  path: string;
  icon: SidebarIconId;
};

export type SidebarNavSection = {
  id: string;
  title: string;
  items: SidebarNavItem[];
};

export type SidebarFriend = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
};

export const brand = {
  name: "Raag App",
  tagline: "Gurbani & Raag",
} as const;

/** Primary navigation blocks (Overview, etc.) */
export const sidebarNav: SidebarNavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      {
        id: "dash",
        label: "Dashboard",
        path: ROUTES.dashboard.home,
        icon: "dashboard",
      },
      {
        id: "course",
        label: "Course",
        path: ROUTES.dashboard.course,
        icon: "course",
      },
      {
        id: "suggestion",
        label: "Suggestion",
        path: ROUTES.dashboard.suggestion,
        icon: "suggestion",
      },
      {
        id: "rating",
        label: "Rating",
        path: ROUTES.dashboard.rating,
        icon: "rating",
      },
    ],
  },
];

/**
 * Legacy “Sangat” placeholder rows (Community / Ustaad / Sevadar) — removed from the sidebar
 * in favor of actionable shortcuts. Kept commented for reference.
 */
// export const sidebarFriends: SidebarFriend[] = [
//   { id: "f1", name: "Community", role: "Study circle" },
//   { id: "f2", name: "Ustaad", role: "Guide" },
//   { id: "f3", name: "Sevadar", role: "Support" },
// ];

/** Header title for the top bar — extend when you add routes */
export function pageTitleForPath(pathname: string): string {
  if (pathname === ROUTES.dashboard.courseNew || pathname.endsWith("/course/new")) {
    return "Add course";
  }
  if (/\/course\/[^/]+\/edit$/.test(pathname)) {
    return "Edit course";
  }
  if (pathname === ROUTES.dashboard.course || pathname.startsWith(`${ROUTES.dashboard.course}/`)) {
    return "Course";
  }
  for (const section of sidebarNav) {
    const hit = section.items.find((i) => i.path === pathname);
    if (hit) return hit.label;
  }
  if (pathname.startsWith(ROUTES.dashboard.settings)) return "Settings";
  return "Dashboard";
}

