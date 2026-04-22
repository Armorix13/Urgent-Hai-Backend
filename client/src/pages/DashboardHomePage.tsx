import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutGrid,
  MessageSquareText,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import {
  fetchDashboardAnalytics,
  type DashboardAnalyticsResponse,
  type TrendPoint,
} from "@/api/dashboardApi";
import { useAuth } from "@/context/AuthContext";
import { ROUTES, courseDetailPath } from "@/routes/paths";

function formatShortDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDayLabel(isoDate: string) {
  try {
    return new Date(isoDate + "T12:00:00.000Z").toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

type Accent = "violet" | "emerald" | "amber" | "sky";

const accentBarClass: Record<Accent, string> = {
  violet:
    "bg-gradient-to-t from-violet-600 via-violet-500 to-violet-300 shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)] dark:from-violet-500 dark:via-violet-400 dark:to-violet-300/90",
  emerald:
    "bg-gradient-to-t from-emerald-700 via-emerald-500 to-emerald-300 shadow-[0_0_20px_-4px_rgba(16,185,129,0.45)] dark:from-emerald-600 dark:via-emerald-400",
  amber:
    "bg-gradient-to-t from-amber-700 via-amber-500 to-amber-300 shadow-[0_0_20px_-4px_rgba(245,158,11,0.4)]",
  sky: "bg-gradient-to-t from-sky-700 via-sky-500 to-sky-300 shadow-[0_0_18px_-4px_rgba(14,165,233,0.4)]",
};

const accentIconWrap: Record<Accent, string> = {
  violet: "bg-violet-500/15 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
  sky: "bg-sky-500/15 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
};

function TrendChart({
  title,
  subtitle,
  points,
  accent,
}: {
  title: string;
  subtitle?: string;
  points: TrendPoint[];
  accent: Accent;
}) {
  const max = useMemo(() => Math.max(1, ...points.map((p) => p.count)), [points]);
  const total = useMemo(() => points.reduce((s, p) => s + p.count, 0), [points]);
  const peakIdx = useMemo(() => {
    let m = -1;
    let idx = 0;
    points.forEach((p, i) => {
      if (p.count > m) {
        m = p.count;
        idx = i;
      }
    });
    return idx;
  }, [points]);

  return (
    <div className="group/chart relative overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_1px_0_0_rgb(0_0_0/0.04)] dark:shadow-[0_1px_0_0_rgb(255_255_255/0.04)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
        style={{
          background:
            accent === "emerald"
              ? "radial-gradient(900px 280px at 100% 0%, rgb(16 185 129 / 0.12), transparent 55%)"
              : "radial-gradient(900px 280px at 100% 0%, rgb(139 92 246 / 0.14), transparent 55%)",
        }}
      />
      <div className="relative p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentIconWrap[accent]}`}
            >
              <Activity className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--app-text)]">{title}</h3>
              {subtitle ? <p className="mt-1 max-w-md text-sm text-[var(--app-muted)]">{subtitle}</p> : null}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-page)]/80 px-4 py-2 text-right backdrop-blur-sm dark:bg-black/20">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">7-day</p>
            <p className="text-xl font-bold tabular-nums tracking-tight text-[var(--app-text)]">{total}</p>
          </div>
        </div>

        <div className="relative mt-8">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between opacity-[0.35]"
            aria-hidden
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-px w-full bg-[var(--app-border)]" />
            ))}
          </div>
          <div className="relative flex h-40 items-end gap-2 sm:gap-3">
            {points.map((p, i) => {
              const h = Math.max(8, (p.count / max) * 100);
              const isPeak = i === peakIdx && p.count > 0;
              return (
                <div key={p.date} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                  <div className="flex h-36 w-full min-h-0 flex-col justify-end px-0.5">
                    <div
                      className={`relative w-full rounded-t-xl transition-all duration-300 group-hover/chart:opacity-95 ${
                        p.count === 0 ? "bg-[var(--app-border)]/60 opacity-50" : accentBarClass[accent]
                      } ${isPeak ? "ring-2 ring-white/40 ring-offset-2 ring-offset-[var(--app-surface)] dark:ring-violet-400/30" : ""}`}
                      style={{ height: `${h}%`, minHeight: p.count === 0 ? "6px" : "10px" }}
                      title={`${p.count} enrollments · ${p.date}`}
                    />
                  </div>
                  <span className="max-w-full truncate text-center text-[11px] font-medium text-[var(--app-muted)]">
                    {formatDayLabel(p.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof BookOpen;
  accent: Accent;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_1px_0_0_rgb(0_0_0/0.04)] transition duration-300 hover:border-[var(--app-border)] hover:shadow-lg hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10 sm:p-6">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl transition duration-500 group-hover:opacity-50"
        style={{
          background:
            accent === "violet"
              ? "rgb(139 92 246)"
              : accent === "emerald"
                ? "rgb(16 185 129)"
                : accent === "amber"
                  ? "rgb(245 158 11)"
                  : "rgb(14 165 233)",
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentIconWrap[accent]}`}>
          <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        </span>
        <TrendingUp className="h-4 w-4 text-[var(--app-muted)] opacity-0 transition group-hover:opacity-60" aria-hidden />
      </div>
      <p className="relative mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)]">
        {label}
      </p>
      <p className="relative mt-2 text-3xl font-bold tabular-nums tracking-tight text-[var(--app-text)] sm:text-4xl">
        {value}
      </p>
      {hint ? <p className="relative mt-2 text-xs leading-relaxed text-[var(--app-muted)]">{hint}</p> : null}
    </div>
  );
}

function Panel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Sparkles;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[22rem] flex-col overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_1px_0_0_rgb(0_0_0/0.04)] dark:shadow-[0_1px_0_0_rgb(255_255_255/0.04)] xl:min-h-[28rem]">
      <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-page)]/50 px-5 py-4 backdrop-blur-sm dark:bg-black/20 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] ring-1 ring-[var(--app-primary)]/10">
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-base font-semibold leading-tight tracking-tight text-[var(--app-text)]">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">{description}</p>
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Star;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-[var(--app-primary)]/20 blur-xl" aria-hidden />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--app-primary-soft)] to-transparent text-[var(--app-primary)] ring-1 ring-[var(--app-border)]">
          <Icon className="h-8 w-8 opacity-90" strokeWidth={1.5} aria-hidden />
        </div>
      </div>
      <p className="mt-5 text-sm font-semibold text-[var(--app-text)]">{title}</p>
      <div className="mt-2 max-w-[240px] text-xs leading-relaxed text-[var(--app-muted)]">{children}</div>
    </div>
  );
}

function rankStyle(i: number): string {
  if (i === 0) return "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30";
  if (i === 1) return "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-md";
  if (i === 2) return "bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 shadow-md";
  return "bg-[var(--app-primary-soft)] text-[var(--app-primary)]";
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchDashboardAnalytics();
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = user?.displayName?.split(" ")[0] ?? "there";
  const isCollaborator = data?.authKind === "collaborator";
  const mine = data?.mine;

  return (
    <div className="space-y-10 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-900 text-white shadow-2xl shadow-violet-950/40">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(125deg, #1e1b4b 0%, #4c1d95 35%, #6d28d9 65%, #7c3aed 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-fuchsia-500/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-400/25 blur-3xl" aria-hidden />

        <div className="relative px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live analytics
            </span>
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.5rem]">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">{displayName}</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-violet-100/90 sm:text-lg">
            {user?.accountType === "collaborator" ? (
              <>
                Analytics for your courses only: enrollments, ratings received, and how many courses you added today, this
                week, and this month.
              </>
            ) : (
              <>A clear read on platform courses, enrollments, and ratings — refreshed from your API.</>
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={ROUTES.dashboard.course}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg shadow-black/20 transition hover:bg-violet-50 hover:shadow-xl"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Browse courses
              <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden />
            </Link>
            <Link
              to={ROUTES.dashboard.rating}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <Star className="h-4 w-4" aria-hidden />
              Ratings
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div
          className="rounded-2xl border border-red-200/80 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading || !data ? (
        <div className="space-y-8">
          <div className="h-48 animate-pulse rounded-3xl bg-[var(--app-border)]/60" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-3xl bg-[var(--app-border)]/50" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {isCollaborator && mine ? (
            <section className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]">Overview</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--app-text)]">Your courses</h2>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Counts include only courses tied to your collaborator login. Platform-wide totals are hidden.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Your total courses"
                  value={mine.totalCourses.toLocaleString()}
                  icon={BookOpen}
                  accent="violet"
                />
                <StatCard
                  label="Your active courses"
                  value={mine.activeCourses.toLocaleString()}
                  icon={GraduationCap}
                  accent="emerald"
                />
                <StatCard
                  label="Enrollments on your courses"
                  value={mine.totalEnrollments.toLocaleString()}
                  hint={
                    mine.totalCourses > 0
                      ? `Active, non-expired seats summed only across your ${mine.totalCourses} course${mine.totalCourses === 1 ? "" : "s"}. Inactive courses can still have enrollments.`
                      : "Active enrollment seats across your courses only"
                  }
                  icon={Users}
                  accent="sky"
                />
                <StatCard
                  label="Ratings received"
                  value={mine.ratingsReceived.toLocaleString()}
                  hint="Total learner reviews on your courses"
                  icon={MessageSquareText}
                  accent="amber"
                />
                <StatCard
                  label="Average rating"
                  value={mine.ratingsReceived > 0 ? mine.ratingsAverage.toFixed(2) : "—"}
                  hint={mine.ratingsReceived > 0 ? "Mean star rating across all reviews on your courses" : "No reviews yet"}
                  icon={Star}
                  accent="violet"
                />
                <StatCard
                  label="Courses added today"
                  value={mine.coursesAddedToday.toLocaleString()}
                  hint="Created since midnight UTC today"
                  icon={Calendar}
                  accent="emerald"
                />
                <StatCard
                  label="Courses added this week"
                  value={mine.coursesAddedThisWeek.toLocaleString()}
                  hint="Created since Monday 00:00 UTC"
                  icon={Calendar}
                  accent="sky"
                />
                <StatCard
                  label="Courses added this month"
                  value={mine.coursesAddedThisMonth.toLocaleString()}
                  hint="Created since the 1st of this month (UTC)"
                  icon={Calendar}
                  accent="amber"
                />
              </div>
            </section>
          ) : !isCollaborator && data.platform ? (
            <section className="space-y-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]">Overview</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--app-text)]">Platform</h2>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">All non-deleted courses across Raag.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Total courses"
                  value={data.platform.totalCourses.toLocaleString()}
                  icon={BookOpen}
                  accent="violet"
                />
                <StatCard
                  label="Active courses"
                  value={data.platform.activeCourses.toLocaleString()}
                  icon={GraduationCap}
                  accent="emerald"
                />
                <StatCard
                  label="Total enrollments"
                  value={data.platform.totalEnrollments.toLocaleString()}
                  hint="Live count of active enrollment records (all courses)"
                  icon={Users}
                  accent="sky"
                />
              </div>
            </section>
          ) : null}

          <section
            className={`grid gap-6 ${!isCollaborator && data.enrollmentTrend.platform.length && data.enrollmentTrend.mine ? "lg:grid-cols-2" : ""}`}
          >
            {!isCollaborator && data.enrollmentTrend.platform.length ? (
              <TrendChart
                title="Platform enrollments"
                subtitle="New sign-ups per day · last 7 days (UTC)"
                points={data.enrollmentTrend.platform}
                accent="violet"
              />
            ) : null}
            {data.enrollmentTrend.mine ? (
              <TrendChart
                title="Enrollments on your courses"
                subtitle="New enrollments per day · last 7 days (UTC) · your collaborator courses only"
                points={data.enrollmentTrend.mine}
                accent="emerald"
              />
            ) : null}
          </section>

          <section className="grid gap-6 xl:grid-cols-3 xl:items-stretch">
            <Panel
              title={isCollaborator ? "Latest enrollments" : "Your enrollments"}
              description={isCollaborator ? "Up to 5 most recent across your courses" : "Up to 5 courses you joined recently"}
              icon={Users}
            >
              {data.recentEnrollments.length === 0 ? (
                <EmptyState icon={Users} title="No enrollments yet">
                  When learners join your courses, they&apos;ll appear here with full titles and dates.
                  <Link
                    to={ROUTES.dashboard.course}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--app-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                  >
                    View courses
                  </Link>
                </EmptyState>
              ) : (
                <ul className="divide-y divide-[var(--app-border)] overflow-y-auto overscroll-contain">
                  {data.recentEnrollments.map((row) => (
                    <li
                      key={row._id}
                      className="transition-colors hover:bg-[var(--app-page)]/55 dark:hover:bg-white/[0.04]"
                    >
                      <div className="px-5 py-4 sm:px-6">
                        {row.course ? (
                          <>
                            <Link
                              to={courseDetailPath(row.course._id)}
                              className="block rounded-md text-[0.9375rem] font-semibold leading-snug text-[var(--app-text)] transition hover:text-[var(--app-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]"
                            >
                              <span className="break-words [overflow-wrap:anywhere]">{row.course.title}</span>
                            </Link>
                            <div className="mt-2.5">
                              <span className="inline-flex max-w-full rounded-lg bg-[var(--app-primary-soft)] px-2.5 py-1 text-[10px] font-bold uppercase leading-snug tracking-wide text-[var(--app-primary)] ring-1 ring-[var(--app-primary)]/15">
                                <span className="break-words [overflow-wrap:anywhere]">
                                  {row.course.category ?? "Course"}
                                </span>
                              </span>
                            </div>
                            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--app-border)]/80 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--app-muted)]">
                                <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                {formatShortDate(row.enrolledAt)}
                              </span>
                              {row.user?.userName ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--app-text-secondary)]">
                                  <UserRound className="h-3.5 w-3.5 shrink-0 text-[var(--app-muted)]" aria-hidden />
                                  <span className="font-medium text-[var(--app-text)]">{row.user.userName}</span>
                                </span>
                              ) : null}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-[var(--app-muted)]">Course no longer available</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Latest ratings"
              description={isCollaborator ? "Recent reviews on your courses" : "Recent reviews platform-wide"}
              icon={Star}
            >
              {data.recentRatings.length === 0 ? (
                <EmptyState icon={MessageSquareText} title="No ratings yet">
                  Reviews will show here once learners rate your courses.
                  <Link
                    to={ROUTES.dashboard.rating}
                    className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-page)] px-4 py-2 text-xs font-semibold text-[var(--app-text)] hover:bg-[var(--app-surface)]"
                  >
                    Open ratings
                  </Link>
                </EmptyState>
              ) : (
                <ul className="divide-y divide-[var(--app-border)] overflow-y-auto overscroll-contain">
                  {data.recentRatings.map((r) => (
                    <li
                      key={r._id}
                      className="transition-colors hover:bg-[var(--app-page)]/55 dark:hover:bg-white/[0.04]"
                    >
                      <div className="px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                          <span className="inline-flex items-center gap-0.5 rounded-lg bg-amber-500/15 px-2 py-0.5 text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">
                            {r.rating.toFixed(1)}
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden />
                          </span>
                          <span className="min-w-0 break-words text-sm font-medium text-[var(--app-text)] [overflow-wrap:anywhere]">
                            {r.user?.userName ?? "Learner"}
                          </span>
                        </div>
                        {r.course ? (
                          <Link
                            to={courseDetailPath(r.course._id)}
                            className="mt-2.5 inline-flex max-w-full items-start gap-1 text-xs font-semibold leading-snug text-[var(--app-primary)] hover:underline"
                          >
                            <span className="break-words [overflow-wrap:anywhere]">{r.course.title}</span>
                            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                          </Link>
                        ) : null}
                        {r.review?.trim() ? (
                          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--app-muted)]">
                            {r.review.trim()}
                          </p>
                        ) : null}
                        <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                          {formatShortDate(r.updatedAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Top rated"
              description={isCollaborator ? "Your highest-rated courses" : "Best-rated on the platform"}
              icon={Sparkles}
            >
              {data.topRatedCourses.length === 0 ? (
                <EmptyState icon={Trophy} title="No rated courses yet">
                  Courses need at least one review to appear here. Encourage learners to leave feedback.
                  <Link
                    to={ROUTES.dashboard.course}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--app-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                  >
                    Go to courses
                  </Link>
                </EmptyState>
              ) : (
                <ul className="divide-y divide-[var(--app-border)] overflow-y-auto overscroll-contain">
                  {data.topRatedCourses.map((c, i) => (
                    <li
                      key={c._id}
                      className="group transition-colors hover:bg-[var(--app-page)]/55 dark:hover:bg-white/[0.04]"
                    >
                      <Link
                        to={courseDetailPath(c._id)}
                        className="flex items-start gap-3 px-5 py-4 sm:gap-4 sm:px-6"
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${rankStyle(i)}`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="break-words font-semibold leading-snug text-[var(--app-text)] [overflow-wrap:anywhere]">
                            {c.title}
                          </p>
                          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--app-muted)]">
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {(c.rating?.average ?? 0).toFixed(1)} ★
                            </span>
                            <span className="text-[var(--app-border)]" aria-hidden>
                              ·
                            </span>
                            <span>{c.rating?.count ?? 0} reviews</span>
                            <span className="text-[var(--app-border)]" aria-hidden>
                              ·
                            </span>
                            <span>{c.enrollmentCount.toLocaleString()} enrolled</span>
                          </p>
                        </div>
                        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--app-muted)] opacity-0 transition-opacity group-hover:opacity-70" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}
