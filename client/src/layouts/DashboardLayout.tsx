import * as ScrollArea from "@radix-ui/react-scroll-area";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { pageTitleForPath } from "../config/navigation";
import AppRightPanel from "../components/layout/AppRightPanel";
import AppSidebar from "../components/layout/AppSidebar";
import AppTopBar from "../components/layout/AppTopBar";
import { useAuth } from "../context/AuthContext";
import { fetchCollaboratorMe } from "../api/collaboratorMeApi";

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const title = pageTitleForPath(pathname);
  const { user, patchUser } = useAuth();

  useEffect(() => {
    if (user?.accountType === "collaborator") {
      fetchCollaboratorMe()
        .then((res) => {
          if (res.success && res.collaborator) {
            patchUser({
              wallet: res.collaborator.wallet ?? 0,
              isRaagManagement: res.collaborator.isRaagManagement !== false,
            });
          }
        })
        .catch((err) => console.error("Failed to load collaborator profile for wallet:", err));
    }
  }, [user?.accountType, patchUser]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--app-page)] text-[var(--app-text)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--app-page)]">
          <AppTopBar title={title} />
          <ScrollArea.Root className="min-h-0 flex-1">
            <ScrollArea.Viewport className="h-full max-h-full">
              <main className="px-4 py-6 sm:px-8 lg:px-10">
                <Outlet />
              </main>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              className="flex w-2 touch-none select-none p-0.5"
            >
              <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[var(--app-border)]" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </div>
        <AppRightPanel />
      </div>
    </div>
  );
}
