import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteCollaboratorReview,
  fetchCollaboratorCourseReviews,
  fetchCollaboratorRatingCourses,
  fetchCollaboratorRatingOverview,
  type CollaboratorCourseRow,
  type CollaboratorRatingOverview,
  type CollaboratorReviewRow,
  type ReviewsPagination,
} from "@/api/ratingApi";
import { ApiError } from "@/lib/api";
import { ROUTES, courseDetailPath } from "@/routes/paths";

function StarRow({ value }: { value: number }) {
  const v = Math.round(Math.min(5, Math.max(0, value)));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < v ? "fill-amber-400 text-amber-400" : "fill-transparent text-[var(--app-border)]"}`}
          strokeWidth={1.35}
        />
      ))}
    </div>
  );
}

function DistributionBars({ dist }: { dist: CollaboratorRatingOverview["distribution"] }) {
  const max = Math.max(1, ...Object.values(dist));
  return (
    <div className="flex flex-col gap-2">
      {([5, 4, 3, 2, 1] as const).map((star) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="w-8 tabular-nums font-medium text-[var(--app-muted)]">{star}★</span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--app-border)]/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
              style={{ width: `${(dist[star] / max) * 100}%` }}
            />
          </div>
          <span className="w-7 text-right tabular-nums text-[var(--app-text-secondary)]">{dist[star]}</span>
        </div>
      ))}
    </div>
  );
}

function PageNav({
  pagination,
  onPage,
  disabled,
}: {
  pagination: ReviewsPagination | null;
  onPage: (p: number) => void;
  disabled?: boolean;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)]/80 bg-[var(--app-page)]/30 px-4 py-3 dark:bg-black/10">
      <p className="text-xs text-[var(--app-muted)]">
        Page {pagination.currentPage} of {pagination.totalPages}
        <span className="text-[var(--app-border)]"> · </span>
        {pagination.totalItems} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || !pagination.hasPrevPage}
          onClick={() => onPage(pagination.currentPage - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] shadow-sm transition hover:bg-[var(--app-page)] disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Prev
        </button>
        <button
          type="button"
          disabled={disabled || !pagination.hasNextPage}
          onClick={() => onPage(pagination.currentPage + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-text)] shadow-sm transition hover:bg-[var(--app-page)] disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

const COURSE_PAGE_SIZE = 12;

export default function CollaboratorRatingsManager() {
  const [overview, setOverview] = useState<CollaboratorRatingOverview | null>(null);
  const [courses, setCourses] = useState<CollaboratorCourseRow[]>([]);
  const [coursesPagination, setCoursesPagination] = useState<ReviewsPagination | null>(null);
  const [coursesPage, setCoursesPage] = useState(1);
  const [courseSearchInput, setCourseSearchInput] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [reviews, setReviews] = useState<CollaboratorReviewRow[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState<{
    course: { _id: string; title: string; category?: string };
    summary: { averageRating: number; totalReviews: number; distribution: CollaboratorRatingOverview["distribution"] };
    pagination: ReviewsPagination;
  } | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setCourseSearch(courseSearchInput.trim()), 320);
    return () => window.clearTimeout(t);
  }, [courseSearchInput]);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await fetchCollaboratorRatingOverview();
      setOverview(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load overview");
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadCourses = useCallback(async (page: number, search: string) => {
    setLoadingCourses(true);
    setError(null);
    try {
      const res = await fetchCollaboratorRatingCourses({
        page,
        limit: COURSE_PAGE_SIZE,
        search: search || undefined,
      });
      setCourses(res.courses ?? []);
      setCoursesPagination(res.pagination ?? null);
      setCoursesPage(page);
      const list = res.courses ?? [];
      setSelectedId((prev) => {
        if (prev && list.some((c) => c._id === prev)) return prev;
        return list[0]?._id ?? null;
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load courses");
      setCourses([]);
      setCoursesPagination(null);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const loadReviews = useCallback(async (courseId: string, page: number) => {
    if (!courseId) return;
    setLoadingReviews(true);
    setError(null);
    try {
      const res = await fetchCollaboratorCourseReviews(courseId, { page, limit: 12 });
      setReviews(res.reviews ?? []);
      setReviewsMeta({
        course: res.course,
        summary: res.summary,
        pagination: res.pagination,
      });
      setReviewsPage(page);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load reviews");
      setReviews([]);
      setReviewsMeta(null);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadCourses(1, courseSearch);
  }, [courseSearch, loadCourses]);

  useEffect(() => {
    if (!selectedId) {
      setReviews([]);
      setReviewsMeta(null);
      setReviewsPage(1);
      return;
    }
    setReviewsPage(1);
    loadReviews(selectedId, 1);
  }, [selectedId, loadReviews]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c._id === selectedId) ?? null,
    [courses, selectedId],
  );

  async function handleDelete(ratingId: string) {
    setDeletingId(ratingId);
    setError(null);
    try {
      await deleteCollaboratorReview(ratingId);
      await loadOverview();
      if (selectedId) await loadReviews(selectedId, reviewsPage);
      await loadCourses(coursesPage, courseSearch);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function formatShort(iso?: string) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <section
        className="relative overflow-hidden rounded-[1.75rem] px-6 py-8 text-white shadow-xl shadow-violet-950/20 sm:px-10 sm:py-10"
        style={{
          background: "linear-gradient(125deg, #4c1d95 0%, #6d28d9 38%, #7c3aed 70%, #a78bfa 130%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.07' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-fuchsia-400/25 blur-2xl" aria-hidden />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Ratings · Collaborator</p>
        <h2 className="relative mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem]">
          Find a course, then open its reviews
        </h2>
        <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-white/90">
          Search your catalog, select a course, and manage learner ratings and comments in one place.
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link
            to={ROUTES.dashboard.course}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-violet-800 shadow-lg shadow-black/15 transition hover:bg-violet-50"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            Manage courses
          </Link>
        </div>
      </section>

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingOverview ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--app-border)]/40" />
          ))
        ) : overview ? (
          <>
            <div className="group relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm transition hover:shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl transition group-hover:bg-amber-400/15" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">Avg rating</p>
              <p className="mt-2 flex items-baseline gap-2 text-3xl font-bold tabular-nums text-[var(--app-text)]">
                {overview.totalReviews > 0 ? overview.averageRating.toFixed(2) : "—"}
                {overview.totalReviews > 0 ? (
                  <Star className="h-6 w-6 fill-amber-400 text-amber-400" aria-hidden />
                ) : null}
              </p>
              <p className="mt-1 text-xs text-[var(--app-muted)]">Across all your courses</p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm transition hover:shadow-md">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">Total reviews</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--app-text)]">
                {overview.totalReviews.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {overview.coursesWithReviews} / {overview.totalCourses} courses with feedback
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                  <BarChart3 className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Star mix · all courses
                </p>
              </div>
              <div className="mt-4">
                <DistributionBars dist={overview.distribution} />
              </div>
            </div>
          </>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
        {/* Course picker + search */}
        <div className="flex flex-col overflow-hidden rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_1px_0_0_rgb(0_0_0/0.04)] dark:shadow-[0_1px_0_0_rgb(255_255_255/0.04)] xl:col-span-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)]">
          <div
            className="shrink-0 border-b border-[var(--app-border)] bg-gradient-to-br from-[var(--app-page)] to-[var(--app-surface)] px-4 py-4 dark:from-black/20 dark:to-transparent"
          >
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-[var(--app-primary)]" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-[var(--app-text)]">Your courses</p>
                <p className="text-[11px] text-[var(--app-muted)]">Search, then tap a row to load reviews</p>
              </div>
            </div>
            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={courseSearchInput}
                onChange={(e) => setCourseSearchInput(e.target.value)}
                placeholder="Search title, category, identifier…"
                autoComplete="off"
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] py-3 pl-10 pr-10 text-sm text-[var(--app-text)] outline-none ring-1 ring-transparent transition placeholder:text-[var(--app-muted)] focus:border-[color-mix(in_srgb,var(--app-primary)_35%,var(--app-border))] focus:ring-[var(--app-primary)]/25"
              />
              {courseSearchInput ? (
                <button
                  type="button"
                  onClick={() => setCourseSearchInput("")}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-[var(--app-page)] hover:text-[var(--app-text)]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : null}
            </div>
            {courseSearch ? (
              <p className="mt-2 text-[11px] text-[var(--app-muted)]">
                Filtering by &ldquo;{courseSearch}&rdquo; · {(coursesPagination?.totalItems ?? 0).toLocaleString()}{" "}
                {(coursesPagination?.totalItems ?? 0) === 1 ? "course" : "courses"}
              </p>
            ) : null}
          </div>

          <div className="min-h-[220px] flex-1 overflow-y-auto overscroll-contain">
            {loadingCourses ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-[var(--app-border)]/35" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                  <Search className="h-7 w-7 opacity-80" strokeWidth={1.75} aria-hidden />
                </div>
                <p className="mt-4 text-sm font-semibold text-[var(--app-text)]">No courses match</p>
                <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-[var(--app-muted)]">
                  Try another search or add courses from the catalog.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5 p-3">
                {courses.map((c) => {
                  const active = c._id === selectedId;
                  const cnt = c.rating?.count ?? 0;
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c._id)}
                        className={[
                          "flex w-full gap-3 rounded-2xl border px-3 py-3 text-left transition",
                          active
                            ? "border-[color-mix(in_srgb,var(--app-primary)_45%,var(--app-border))] bg-[var(--app-primary-soft)] shadow-[inset_3px_0_0_0_var(--app-primary)]"
                            : "border-transparent bg-[var(--app-page)]/60 hover:border-[var(--app-border)] hover:bg-[var(--app-page)] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
                        ].join(" ")}
                      >
                        <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-200/90 to-fuchsia-200/80 dark:from-violet-950 dark:to-fuchsia-950">
                          {c.thumbnail ? (
                            <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-violet-600/50 dark:text-violet-300/40">
                              <BookOpen className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <span className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--app-text)]">
                            {c.title}
                          </span>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-[var(--app-surface)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-muted)] ring-1 ring-[var(--app-border)]/80">
                              {c.category}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
                              {(c.rating?.average ?? 0).toFixed(1)}
                              <span className="font-normal text-[var(--app-muted)]">({cnt})</span>
                            </span>
                            {!c.isActive ? (
                              <span className="rounded-md bg-[var(--app-border)]/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--app-text-secondary)]">
                                Inactive
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <PageNav
            pagination={coursesPagination}
            disabled={loadingCourses}
            onPage={(p) => loadCourses(p, courseSearch)}
          />
        </div>

        {/* Reviews */}
        <div
          className="flex min-h-[min(32rem,70vh)] flex-col overflow-hidden rounded-[1.25rem] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_1px_0_0_rgb(0_0_0/0.04)] dark:shadow-[0_1px_0_0_rgb(255_255_255/0.04)] xl:col-span-8"
        >
          {!selectedId ? (
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8 py-20 text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
                style={{
                  background:
                    "radial-gradient(500px 240px at 50% 0%, color-mix(in srgb, var(--app-primary) 12%, transparent), transparent 65%)",
                }}
              />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)] ring-4 ring-[var(--app-primary)]/10">
                <Sparkles className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="relative mt-6 text-lg font-semibold text-[var(--app-text)]">Select a course</p>
              <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-[var(--app-muted)]">
                Use the search on the left to find a course, then select it. Ratings and comments will open here.
              </p>
            </div>
          ) : (
            <>
              <div className="relative shrink-0 overflow-hidden border-b border-[var(--app-border)]">
                <div
                  className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--app-primary) 18%, transparent), transparent 55%)",
                  }}
                />
                <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div className="flex min-w-0 gap-4">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-200 to-fuchsia-200 shadow-inner dark:from-violet-950 dark:to-fuchsia-950">
                      {selectedCourse?.thumbnail ? (
                        <img
                          src={selectedCourse.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-violet-500/40">
                          <BookOpen className="h-8 w-8" aria-hidden />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 py-0.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--app-muted)]">
                        {reviewsMeta?.course.category ?? selectedCourse?.category ?? "Course"}
                      </p>
                      <h3 className="mt-1 text-xl font-bold leading-snug tracking-tight text-[var(--app-text)] sm:text-2xl">
                        {reviewsMeta?.course.title ?? selectedCourse?.title}
                      </h3>
                      <Link
                        to={courseDetailPath(selectedId)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-primary)] transition hover:gap-1.5 hover:underline"
                      >
                        View course
                        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      </Link>
                    </div>
                  </div>
                  {reviewsMeta ? (
                    <div className="flex shrink-0 flex-col items-stretch rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]/90 px-5 py-4 text-center shadow-sm backdrop-blur-sm sm:min-w-[9rem] sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                        Course average
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--app-text)]">
                        {reviewsMeta.summary.totalReviews > 0
                          ? reviewsMeta.summary.averageRating.toFixed(2)
                          : "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                        {reviewsMeta.summary.totalReviews} review{reviewsMeta.summary.totalReviews === 1 ? "" : "s"}
                      </p>
                    </div>
                  ) : null}
                </div>
                {reviewsMeta && reviewsMeta.summary.totalReviews > 0 ? (
                  <div className="relative border-t border-[var(--app-border)]/80 bg-[var(--app-page)]/40 px-5 py-4 dark:bg-black/15 sm:px-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                      This course · star spread
                    </p>
                    <div className="mt-3 max-w-md">
                      <DistributionBars dist={reviewsMeta.summary.distribution} />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {loadingReviews ? (
                  <div className="flex items-center justify-center gap-2 py-20 text-sm text-[var(--app-muted)]">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--app-primary)]" aria-hidden />
                    Loading reviews…
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <MessageSquare className="h-11 w-11 text-[var(--app-muted)]/45" strokeWidth={1.25} aria-hidden />
                    <p className="mt-4 text-sm font-medium text-[var(--app-text)]">No reviews yet</p>
                    <p className="mt-1 max-w-xs text-xs text-[var(--app-muted)]">
                      When learners rate this course, entries will show up here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--app-border)]/90">
                    {reviews.map((r) => (
                      <li
                        key={r._id}
                        className="px-5 py-5 transition-colors hover:bg-[color-mix(in_srgb,var(--app-page)_70%,transparent)] sm:px-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 px-2.5 py-1 text-sm font-bold tabular-nums text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-300">
                                {r.rating.toFixed(1)}
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden />
                              </span>
                              <StarRow value={r.rating} />
                              <span className="text-sm font-semibold text-[var(--app-text)]">
                                {r.user?.userName ?? "Learner"}
                              </span>
                            </div>
                            {r.review?.trim() ? (
                              <p className="mt-3 rounded-xl border border-[var(--app-border)]/60 bg-[var(--app-page)]/50 px-4 py-3 text-sm leading-relaxed text-[var(--app-text-secondary)] dark:bg-black/20">
                                {r.review.trim()}
                              </p>
                            ) : (
                              <p className="mt-3 text-xs italic text-[var(--app-muted)]">No written comment</p>
                            )}
                            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                              Updated {formatShort(r.updatedAt)}
                            </p>
                          </div>
                          <AlertDialog.Root>
                            <AlertDialog.Trigger asChild>
                              <button
                                type="button"
                                disabled={deletingId === r._id}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-red-200/90 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/55 dark:bg-red-950/45 dark:text-red-300 dark:hover:bg-red-950/75"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Remove
                              </button>
                            </AlertDialog.Trigger>
                            <AlertDialog.Portal>
                              <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]" />
                              <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-2xl focus:outline-none">
                                <AlertDialog.Title className="text-lg font-semibold text-[var(--app-text)]">
                                  Remove this review?
                                </AlertDialog.Title>
                                <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                                  This deletes the learner&apos;s star rating and comment for your course. They can submit a
                                  new rating later if they enroll again.
                                </AlertDialog.Description>
                                <div className="mt-6 flex justify-end gap-2 border-t border-[var(--app-border)] pt-4">
                                  <AlertDialog.Cancel asChild>
                                    <button
                                      type="button"
                                      className="rounded-xl border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-page)]"
                                    >
                                      Cancel
                                    </button>
                                  </AlertDialog.Cancel>
                                  <AlertDialog.Action asChild>
                                    <button
                                      type="button"
                                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                                      onClick={() => handleDelete(r._id)}
                                    >
                                      Remove review
                                    </button>
                                  </AlertDialog.Action>
                                </div>
                              </AlertDialog.Content>
                            </AlertDialog.Portal>
                          </AlertDialog.Root>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {reviewsMeta ? (
                <PageNav
                  pagination={reviewsMeta.pagination}
                  disabled={loadingReviews}
                  onPage={(p) => {
                    setReviewsPage(p);
                    if (selectedId) void loadReviews(selectedId, p);
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
