import { Outlet } from "react-router-dom";

/** Nested routes: list / new / :id/edit — no extra chrome (dashboard shell wraps this). */
export default function CourseSectionLayout() {
  return <Outlet />;
}
