import { BarChart3, BookOpen, PlusCircle, Star } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { brand, sidebarNav } from "../../config/navigation";
import { ROUTES } from "../../routes/paths";
import { useAuth } from "../../context/AuthContext";
import { SidebarGlyph } from "./nav-icons";

function BrandMark() {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      style={{ background: "var(--app-primary)" }}
    >
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l1.8 6.2H20l-5 3.8L17.8 19 12 15.2 6.2 19 9 12 4 8.2h6.2L12 2z" />
      </svg>
    </div>
  );
}

export default function AppSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className="flex h-full w-[280px] shrink-0 flex-col border-r bg-[var(--app-surface)]"
      style={{ borderColor: "var(--app-border)" }}
    >
      <div className="flex items-center gap-3 px-6 pb-6 pt-8">
        <BrandMark />
        <div className="min-w-0">
          <p
            className="truncate text-lg font-bold tracking-tight"
            style={{ color: "var(--app-primary)" }}
          >
            {brand.name}
          </p>
          <p className="truncate text-xs text-[var(--app-muted)]">{brand.tagline}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
        {sidebarNav.map((section) => (
          <div key={section.id}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    end={item.path === ROUTES.dashboard.home}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)] dark:bg-[var(--app-primary-soft-dark)]"
                          : "text-[var(--app-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5",
                      ].join(" ")
                    }
                  >
                    <SidebarGlyph id={item.icon} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="px-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
            Shortcuts
          </p>
          <div className="space-y-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-page)]/50 p-1.5 dark:bg-white/[0.04]">
            <NavLink
              to={ROUTES.dashboard.home}
              end
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                  isActive
                    ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)] dark:bg-[var(--app-primary-soft-dark)]"
                    : "text-[var(--app-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5",
                ].join(" ")
              }
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] dark:bg-[var(--app-primary-soft-dark)]">
                <BarChart3 className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Analytics</span>
                <span className="block text-xs opacity-80">Enrollments &amp; ratings</span>
              </span>
            </NavLink>
            <NavLink
              to={ROUTES.dashboard.courseNew}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                  isActive
                    ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)] dark:bg-[var(--app-primary-soft-dark)]"
                    : "text-[var(--app-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5",
                ].join(" ")
              }
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <PlusCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Add course</span>
                <span className="block text-xs opacity-80">Create new content</span>
              </span>
            </NavLink>
            <NavLink
              to={ROUTES.dashboard.course}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                  isActive
                    ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)] dark:bg-[var(--app-primary-soft-dark)]"
                    : "text-[var(--app-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5",
                ].join(" ")
              }
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <BookOpen className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Course library</span>
                <span className="block text-xs opacity-80">Browse all courses</span>
              </span>
            </NavLink>
            <NavLink
              to={ROUTES.dashboard.rating}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                  isActive
                    ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)] dark:bg-[var(--app-primary-soft-dark)]"
                    : "text-[var(--app-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5",
                ].join(" ")
              }
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Star className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Rate &amp; review</span>
                <span className="block text-xs opacity-80">Your enrolled courses</span>
              </span>
            </NavLink>
          </div>
        </div>
      </nav>

      <div
        className="mt-auto space-y-1 border-t px-3 py-4"
        style={{ borderColor: "var(--app-border)" }}
      >
        <NavLink
          to={ROUTES.dashboard.settings}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium",
              isActive
                ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)] dark:bg-[var(--app-primary-soft-dark)]"
                : "text-[var(--app-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5",
            ].join(" ")
          }
        >
          <SidebarGlyph id="settings" />
          Settings
        </NavLink>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          onClick={() => {
            logout();
            navigate(ROUTES.login, { replace: true });
          }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
