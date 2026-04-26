import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { brand, pageTitleForPath } from "@/config/navigation";
import { ROUTES } from "@/routes/paths";

/**
 * Keeps `document.title` in sync with the route so static `index.html` titles
 * (and first paint) are replaced with branded titles after load.
 */
export default function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === ROUTES.login) {
      document.title = `${brand.name} · Sign in`;
      return;
    }
    if (pathname === ROUTES.dashboard.home) {
      document.title = brand.name;
      return;
    }
    document.title = `${brand.name} · ${pageTitleForPath(pathname)}`;
  }, [pathname]);

  return null;
}
