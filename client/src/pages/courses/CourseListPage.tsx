import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Separator from "@radix-ui/react-separator";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteCourse,
  fetchCoursesAdmin,
  type Course,
  type CourseTypeNum,
} from "@/api/courseApi";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { buildCourseThumbnailCandidates } from "@/lib/youtubeThumbnail";
import { ROUTES, courseDetailPath, courseEditPath } from "@/routes/paths";

type Filter = "all" | CourseTypeNum;

function filterFromTypeParam(searchParams: URLSearchParams): Filter {
  const t = searchParams.get("type")?.toLowerCase();
  if (t === "paid") return 1;
  if (t === "free") return 2;
  return "all";
}

const actionIconClass =
  "inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/45 bg-white/95 text-slate-800 shadow-lg backdrop-blur-md transition duration-200 hover:scale-110 hover:bg-white hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/12 dark:bg-zinc-900/92 dark:text-white dark:hover:bg-zinc-800";

function CourseCardThumbnail({ course }: { course: Course }) {
  const candidates = useMemo(
    () => buildCourseThumbnailCandidates(course),
    [course],
  );
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    setFailed(0);
  }, [course._id, candidates.join("|")]);

  if (!candidates.length || failed >= candidates.length) {
    return null;
  }

  return (
    <img
      key={`${course._id}-${failed}`}
      src={candidates[failed]}
      alt=""
      className="absolute inset-0 z-0 h-full w-full object-cover"
      onError={() => setFailed((n) => n + 1)}
    />
  );
}

export default function CourseListPage() {
  const { user } = useAuth();
  const token = user?.accessToken;
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = useMemo(
    () => filterFromTypeParam(searchParams),
    [searchParams],
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalCourses: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCoursesAdmin({
        page,
        limit: 12,
        search: searchDebounced || undefined,
        courseType: filter === "all" ? undefined : filter,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...(user?.accountType === "collaborator" ? { mine: true } : {}),
      });
      setCourses(res.courses ?? []);
      if (res.pagination) {
        setPagination({
          totalPages: res.pagination.totalPages,
          hasNextPage: res.pagination.hasNextPage,
          hasPrevPage: res.pagination.hasPrevPage,
          totalCourses: res.pagination.totalCourses,
        });
      } else setPagination(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchDebounced, token, user?.accountType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  function setTypeParam(next: Filter) {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === "all") {
          p.delete("type");
        } else if (next === 1) {
          p.set("type", "paid");
        } else {
          p.set("type", "free");
        }
        return p;
      },
      { replace: true },
    );
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteCourse(id);
      await load();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Delete failed";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
            {user?.accountType === "collaborator" ? "Your courses" : "All courses"}
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {user?.accountType === "collaborator"
              ? "Only courses where you are the collaborator (matched on save). Sign in as a learner to browse the full catalog elsewhere."
              : "Browse every course type — paid and free — in one place."}
          </p>
        </div>
        <Link
          to={ROUTES.dashboard.courseNew}
          className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          style={{ background: "var(--app-primary)" }}
        >
          Add course
        </Link>
      </div>

      {!token && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--app-border)",
            background: "var(--app-primary-soft)",
            color: "var(--app-primary)",
          }}
        >
          Sign in with email and password to create, edit, or delete courses (JWT
          required).
        </div>
      )}

      {error && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      <div
        className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
      >
        <input
          type="search"
          placeholder="Search title, category, tags…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-xl border bg-[var(--app-page)] px-4 py-2.5 text-sm text-[var(--app-text)] outline-none ring-1 ring-[var(--app-border)] focus:ring-2 focus:ring-[var(--app-primary)] sm:flex-1"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              [1, "Paid"],
              [2, "Free"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => {
                setTypeParam(v as Filter);
              }}
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold transition",
                filter === v
                  ? "text-white shadow-sm"
                  : "bg-[var(--app-page)] text-[var(--app-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
              style={
                filter === v
                  ? { background: "var(--app-primary)" }
                  : { border: "1px solid var(--app-border)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Separator.Root className="h-px bg-[var(--app-border)]" />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl bg-[var(--app-border)]/40"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed px-6 py-16 text-center"
          style={{ borderColor: "var(--app-border)" }}
        >
          <p className="text-[var(--app-muted)]">No courses match your filters.</p>
          {token && (
            <Link
              to={ROUTES.dashboard.courseNew}
              className="mt-4 inline-block text-sm font-semibold"
              style={{ color: "var(--app-primary)" }}
            >
              Create the first course
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <article
              key={c._id}
              className="group/card relative flex flex-col overflow-hidden rounded-2xl border bg-[var(--app-surface)] shadow-sm ring-1 ring-slate-950/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:ring-white/[0.06]"
              style={{ borderColor: "var(--app-border)" }}
            >
              <div
                className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-violet-200 via-purple-100 to-fuchsia-100 dark:from-violet-950 dark:via-purple-950 dark:to-fuchsia-950"
              >
                <CourseCardThumbnail course={c} />
                <span
                  className="absolute left-3 top-3 z-[4] rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md backdrop-blur-[2px]"
                  style={{
                    background:
                      c.courseType === 1
                        ? "linear-gradient(135deg,#7c3aed,#5b21b6)"
                        : "linear-gradient(135deg,#059669,#047857)",
                  }}
                >
                  {c.courseType === 1 ? "Paid" : "Free"}
                </span>
                {c.isActive === false && (
                  <span className="absolute right-3 top-3 z-[4] rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    Inactive
                  </span>
                )}

                <div className="absolute inset-0 z-[3] flex items-center justify-center gap-3 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-950/10 opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100">
                  <Link
                    to={courseDetailPath(c._id)}
                    title="View course"
                    className={actionIconClass}
                  >
                    <EyeIcon className="h-5 w-5" />
                    <span className="sr-only">View course details</span>
                  </Link>
                  <Link
                    to={courseEditPath(c._id)}
                    title="Edit course"
                    className={actionIconClass}
                  >
                    <PencilIcon className="h-5 w-5" />
                    <span className="sr-only">Edit course</span>
                  </Link>
                  <AlertDialog.Root>
                    <AlertDialog.Trigger asChild>
                      <button
                        type="button"
                        title="Delete course"
                        disabled={!token || deletingId === c._id}
                        className={`${actionIconClass} text-red-600 hover:!bg-red-50 hover:!border-red-200 dark:text-red-400 dark:hover:!bg-red-950/55 dark:hover:!border-red-900 disabled:opacity-40`}
                      >
                        {deletingId === c._id ? (
                          <span className="text-lg leading-none">…</span>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                        <span className="sr-only">Delete course</span>
                      </button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Portal>
                      <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/50" />
                      <AlertDialog.Content
                        className="fixed left-1/2 top-1/2 z-[101] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-[var(--app-surface)] p-6 shadow-xl focus:outline-none"
                        style={{ borderColor: "var(--app-border)" }}
                      >
                        <div className="flex gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                            aria-hidden
                          >
                            <TrashIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <AlertDialog.Title className="text-lg font-semibold leading-snug text-[var(--app-text)]">
                              Delete this course?
                            </AlertDialog.Title>
                            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                              <span className="block font-medium text-[var(--app-text)]">“{c.title}”</span>
                              This removes it from the catalog (soft delete).
                            </AlertDialog.Description>
                          </div>
                        </div>
                        <div
                          className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          <AlertDialog.Cancel asChild>
                            <button
                              type="button"
                              className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--app-page)]"
                              style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
                            >
                              Cancel
                            </button>
                          </AlertDialog.Cancel>
                          <AlertDialog.Action asChild>
                            <button
                              type="button"
                              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                              onClick={() => handleDelete(c._id)}
                            >
                              Delete
                            </button>
                          </AlertDialog.Action>
                        </div>
                      </AlertDialog.Content>
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                  {c.category}
                </p>
                <Link
                  to={courseDetailPath(c._id)}
                  className="mt-1 line-clamp-2 text-base font-semibold text-[var(--app-text)] transition hover:text-[var(--app-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ outlineColor: "var(--app-primary)" }}
                >
                  {c.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--app-text-secondary)]">
                  {c.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--app-muted)]">
                  {c.level && (
                    <span
                      className="rounded-lg px-2 py-0.5 capitalize ring-1 ring-[var(--app-border)]"
                      style={{ background: "var(--app-page)" }}
                    >
                      {c.level}
                    </span>
                  )}
                  {c.courseType === 1 && (
                    <span className="font-semibold text-[var(--app-text)]">
                      {typeof c.price === "number" ? c.price.toLocaleString() : "—"}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border px-4 py-2 text-sm font-medium disabled:opacity-40"
            style={{ borderColor: "var(--app-border)" }}
          >
            Previous
          </button>
          <span className="text-sm text-[var(--app-muted)]">
            Page {page} of {pagination.totalPages} · {pagination.totalCourses} total
          </span>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border px-4 py-2 text-sm font-medium disabled:opacity-40"
            style={{ borderColor: "var(--app-border)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
