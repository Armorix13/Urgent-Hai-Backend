import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "./paths";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.login} replace />;
  return <>{children}</>;
}

/** `/` → dashboard when signed in, otherwise login */
export function RootRedirect() {
  const { user } = useAuth();
  return (
    <Navigate to={user ? ROUTES.dashboard.home : ROUTES.login} replace />
  );
}
