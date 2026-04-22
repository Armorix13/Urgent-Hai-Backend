/**
 * Dashboard child routes that still use a stub page (no dedicated screen yet).
 */

export type DashboardStubRoute = {
  path: string;
  title: string;
  description: string;
};

/** Reserved for placeholder routes; empty when every dashboard child has a real page. */
export const dashboardStubRoutes: DashboardStubRoute[] = [];
