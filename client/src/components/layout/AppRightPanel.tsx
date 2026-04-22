import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { BookOpen, ChevronRight, LayoutGrid, MoreHorizontal, Sparkles } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ROUTES } from "@/routes/paths";

const weekBars = [0.45, 0.72, 0.55, 0.9, 0.62, 0.78, 0.5];
const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppRightPanel() {
  const ringGradId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const display = user?.displayName?.trim() || "Learner";
  const firstName = display.split(/\s+/)[0] || display;
  const isCollaborator = user?.accountType === "collaborator";
  const progress = 0.68;

  const tagline = isCollaborator
    ? "Manage your courses, enrollments, and learner momentum from here."
    : "Continue your riyaz and reach your learning milestones.";

  return (
    <aside
      className="relative hidden h-full min-h-0 w-[min(100%,19rem)] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-l xl:flex"
      style={{
        borderColor: "var(--app-border)",
        background:
          "linear-gradient(180deg, var(--app-surface) 0%, color-mix(in srgb, var(--app-page) 88%, var(--app-surface)) 55%, var(--app-page) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-[0.4]"
        style={{
          background:
            "radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--app-primary) 14%, transparent), transparent 52%), radial-gradient(90% 60% at 0% 100%, color-mix(in srgb, var(--app-primary) 8%, transparent), transparent 45%)",
        }}
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-7">
          <div className="min-w-0 pt-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">Sidebar</p>
            <p className="mt-1 text-sm font-semibold leading-tight text-[var(--app-text)]">Your profile</p>
            <span
              className="mt-2 inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1"
              style={{
                color: "var(--app-primary)",
                background: "var(--app-primary-soft)",
                borderColor: "color-mix(in srgb, var(--app-primary) 22%, transparent)",
                boxShadow: "0 1px 0 color-mix(in srgb, var(--app-primary) 12%, transparent)",
              }}
            >
              {isCollaborator ? "Collaborator" : "Learner"}
            </span>
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-[var(--app-muted)] shadow-sm transition hover:border-[var(--app-border)] hover:bg-[var(--app-page)] hover:text-[var(--app-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]"
                style={{
                  borderColor: "var(--app-border)",
                  background: "color-mix(in srgb, var(--app-surface) 70%, var(--app-page))",
                }}
                aria-label="Profile menu"
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-[200] min-w-[13.5rem] rounded-2xl border bg-[var(--app-surface)] p-1.5 shadow-xl shadow-black/10 dark:shadow-black/40"
                style={{ borderColor: "var(--app-border)" }}
                align="end"
                sideOffset={8}
              >
                <DropdownMenu.Item asChild>
                  <Link
                    to={ROUTES.dashboard.settings}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--app-text)] outline-none data-[highlighted]:bg-black/[0.06] dark:data-[highlighted]:bg-white/[0.08]"
                  >
                    Settings
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link
                    to={ROUTES.dashboard.rating}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--app-text)] outline-none data-[highlighted]:bg-black/[0.06] dark:data-[highlighted]:bg-white/[0.08]"
                  >
                    Ratings &amp; enrollments
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link
                    to={ROUTES.dashboard.suggestion}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--app-text)] outline-none data-[highlighted]:bg-black/[0.06] dark:data-[highlighted]:bg-white/[0.08]"
                  >
                    Suggestions
                  </Link>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <div className="flex flex-col items-center px-5 pb-2 pt-5">
          <div className="relative grid place-items-center" aria-hidden>
            <div
              className="absolute inset-[-6px] rounded-full opacity-70 blur-xl"
              style={{ background: "color-mix(in srgb, var(--app-primary) 35%, transparent)" }}
            />
            <svg className="relative h-[7.75rem] w-[7.75rem] -rotate-90 drop-shadow-sm" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                className="text-[var(--app-border)]"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={`url(#${ringGradId})`}
                strokeWidth="9"
                strokeDasharray={`${progress * 326.73} 326.73`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id={ringGradId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
            <div
              className="absolute flex h-[5.35rem] w-[5.35rem] items-center justify-center rounded-full text-lg font-bold tracking-tight text-white shadow-[0_12px_28px_-8px_rgba(91,33,182,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] ring-2 ring-white/25 dark:ring-white/15"
              style={{
                background: "linear-gradient(145deg, color-mix(in srgb, var(--app-primary) 92%, white) 0%, #5b21b6 100%)",
              }}
            >
              {(display.slice(0, 2) || "??").toUpperCase()}
            </div>
          </div>
          <p className="sr-only">Progress ring illustration at about {Math.round(progress * 100)} percent.</p>
          <p className="mt-6 text-center text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--app-text)]">
            {greetingForHour(new Date().getHours())}, {firstName}
          </p>
          <p className="mt-2 max-w-[15.5rem] text-center text-xs leading-relaxed text-[var(--app-muted)]">{tagline}</p>
        </div>

        <div className="px-5 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Shortcuts</p>
          <nav className="mt-3 flex flex-col gap-2" aria-label="Quick navigation">
            <Link
              to={ROUTES.dashboard.home}
              className="group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition hover:border-[color-mix(in_srgb,var(--app-primary)_28%,var(--app-border))] hover:bg-[color-mix(in_srgb,var(--app-primary-soft)_65%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]"
              style={{
                borderColor: "var(--app-border)",
                background: "color-mix(in srgb, var(--app-surface) 55%, var(--app-page))",
                boxShadow: "0 1px 0 color-mix(in srgb, var(--app-border) 45%, transparent)",
              }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] ring-1 ring-[color-mix(in_srgb,var(--app-primary)_18%,transparent)]">
                <LayoutGrid className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--app-text)]">Dashboard</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--app-muted)]">Overview &amp; analytics</span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[var(--app-muted)] opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
            <Link
              to={ROUTES.dashboard.course}
              className="group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition hover:border-[color-mix(in_srgb,var(--app-primary)_28%,var(--app-border))] hover:bg-[color-mix(in_srgb,var(--app-primary-soft)_65%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]"
              style={{
                borderColor: "var(--app-border)",
                background: "color-mix(in srgb, var(--app-surface) 55%, var(--app-page))",
                boxShadow: "0 1px 0 color-mix(in srgb, var(--app-border) 45%, transparent)",
              }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] ring-1 ring-[color-mix(in_srgb,var(--app-primary)_18%,transparent)]">
                <BookOpen className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--app-text)]">Courses</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--app-muted)]">
                  {isCollaborator ? "Your catalog &amp; edits" : "Browse the library"}
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[var(--app-muted)] opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
            <Link
              to={ROUTES.dashboard.settings}
              className="group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition hover:border-[color-mix(in_srgb,var(--app-primary)_28%,var(--app-border))] hover:bg-[color-mix(in_srgb,var(--app-primary-soft)_65%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]"
              style={{
                borderColor: "var(--app-border)",
                background: "color-mix(in srgb, var(--app-surface) 55%, var(--app-page))",
                boxShadow: "0 1px 0 color-mix(in srgb, var(--app-border) 45%, transparent)",
              }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] ring-1 ring-[color-mix(in_srgb,var(--app-primary)_18%,transparent)]">
                <Sparkles className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--app-text)]">Settings</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--app-muted)]">Account &amp; preferences</span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[var(--app-muted)] opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
          </nav>
        </div>

        <div className="mx-5 mb-5 rounded-2xl border p-4 shadow-sm" style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Activity</p>
              <p className="mt-1 text-xs font-medium text-[var(--app-text)]">This week</p>
            </div>
            <span className="rounded-lg bg-[var(--app-primary-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--app-primary)] ring-1 ring-[color-mix(in_srgb,var(--app-primary)_20%,transparent)]">
              Sample
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--app-muted)]">Placeholder rhythm — hook up live stats anytime.</p>
          <div className="mt-4 flex h-[7.25rem] items-end gap-1.5 rounded-xl bg-[var(--app-page)]/90 px-3 pb-2 pt-4 ring-1 ring-[var(--app-border)]/80 dark:bg-black/20">
            {weekBars.map((h, i) => (
              <div key={i} className="flex h-full min-h-0 flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full max-w-[1.65rem] rounded-full rounded-b-sm shadow-sm transition hover:opacity-95"
                  style={{
                    height: `${12 + h * 68}%`,
                    minHeight: "18px",
                    background:
                      i === 3
                        ? "linear-gradient(180deg, #ddd6fe, var(--app-primary))"
                        : "linear-gradient(180deg, rgb(167 139 250 / 0.5), rgb(124 58 237 / 0.75))",
                  }}
                />
                <span className="text-[10px] font-medium tabular-nums text-[var(--app-muted)]">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-auto border-t px-5 py-6"
          style={{
            borderColor: "var(--app-border)",
            background: "color-mix(in srgb, var(--app-page) 40%, transparent)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Appearance</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--app-muted)]">Theme follows your tokens. Stored in this browser.</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Color theme">
            <button
              type="button"
              role="radio"
              aria-checked={theme === "light"}
              onClick={() => setTheme("light")}
              className={[
                "relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-3.5 text-sm font-semibold transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]",
                theme === "light"
                  ? "border-transparent text-white shadow-md"
                  : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-page)]",
              ].join(" ")}
              style={
                theme === "light"
                  ? {
                      background: "linear-gradient(145deg, color-mix(in srgb, var(--app-primary) 95%, white), var(--app-primary))",
                      boxShadow: "0 8px 24px -10px color-mix(in srgb, var(--app-primary) 55%, transparent)",
                    }
                  : undefined
              }
            >
              {theme === "light" ? (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold text-white" aria-hidden>
                  ✓
                </span>
              ) : null}
              <SunIcon className={`h-6 w-6 shrink-0 ${theme === "light" ? "text-white" : "text-[var(--app-muted)]"}`} />
              Light
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={[
                "relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-3.5 text-sm font-semibold transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]",
                theme === "dark"
                  ? "border-transparent text-white shadow-md"
                  : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-page)]",
              ].join(" ")}
              style={
                theme === "dark"
                  ? {
                      background: "linear-gradient(145deg, #4c1d95, var(--app-primary))",
                      boxShadow: "0 8px 24px -10px rgb(76 29 149 / 0.55)",
                    }
                  : undefined
              }
            >
              {theme === "dark" ? (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white" aria-hidden>
                  ✓
                </span>
              ) : null}
              <MoonIcon className={`h-6 w-6 shrink-0 ${theme === "dark" ? "text-white" : "text-[var(--app-muted)]"}`} />
              Dark
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
