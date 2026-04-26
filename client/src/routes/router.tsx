import { createBrowserRouter, Navigate } from "react-router-dom";
import CourseSectionLayout from "../layouts/CourseSectionLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import RootLayout from "../layouts/RootLayout";
import DashboardHomePage from "../pages/DashboardHomePage";
import CourseDetailPage from "../pages/courses/CourseDetailPage";
import CourseFormPage from "../pages/courses/CourseFormPage";
import CourseListPage from "../pages/courses/CourseListPage";
import DashboardStubPage from "../pages/DashboardStubPage";
import LoginPage from "../pages/LoginPage";
import RatingPage from "../pages/rating/RatingPage";
import SettingsPage from "../pages/settings/SettingsPage";
import SuggestionPage from "../pages/suggestion/SuggestionPage";
import { dashboardStubRoutes } from "./dashboardRouteConfig";
import { RequireAuth, RootRedirect } from "./guards";
import { ROUTES } from "./paths";

/**
 * App route tree — React Router Data API (`createBrowserRouter`).
 * Guards live in `guards.tsx`; path strings in `paths.ts`.
 */
export function createAppRouter() {
  return createBrowserRouter(
    [
      {
        element: <RootLayout />,
        children: [
          { path: ROUTES.root, element: <RootRedirect /> },
          { path: ROUTES.login, element: <LoginPage /> },
          {
            path: ROUTES.dashboard.home,
            element: (
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            ),
            children: [
              { index: true, element: <DashboardHomePage /> },
              {
                path: "course",
                element: <CourseSectionLayout />,
                children: [
                  { index: true, element: <CourseListPage /> },
                  { path: "new", element: <CourseFormPage /> },
                  { path: ":courseId/edit", element: <CourseFormPage /> },
                  { path: ":courseId", element: <CourseDetailPage /> },
                ],
              },
              { path: "rating", element: <RatingPage /> },
              { path: "suggestion", element: <SuggestionPage /> },
              { path: "settings", element: <SettingsPage /> },
              ...dashboardStubRoutes.map((r) => ({
                path: r.path,
                element: (
                  <DashboardStubPage title={r.title} description={r.description} />
                ),
              })),
            ],
          },
          { path: "*", element: <Navigate to={ROUTES.root} replace /> },
        ],
      },
    ],
    { basename: import.meta.env.BASE_URL },
  );
}
