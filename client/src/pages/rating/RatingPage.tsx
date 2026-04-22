import * as Label from "@radix-ui/react-label";
import * as Separator from "@radix-ui/react-separator";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyEnrollments, type EnrollmentRow } from "@/api/enrollmentApi";
import { submitCourseRating } from "@/api/ratingApi";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";
import CollaboratorRatingsManager from "./CollaboratorRatingsManager";

function StarDisplay({ value, max = 5, size = "md" }: { value: number; max?: number; size?: "sm" | "md" }) {
  const v = Math.round(Math.min(max, Math.max(0, value)));
  const h = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`${h} ${i < v ? "text-amber-400" : "text-[var(--app-border)]"}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Your rating 1 to 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded-lg p-1 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] ${
            n <= value ? "text-amber-400" : "text-[var(--app-border)]"
          }`}
          aria-pressed={n <= value}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function RatingCard({
  row,
  onSaved,
}: {
  row: EnrollmentRow;
  onSaved: () => void;
}) {
  const course = row.course;
  const initial = row.myRating;
  const [stars, setStars] = useState(initial?.rating ?? 0);
  const [review, setReview] = useState(initial?.review ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setStars(initial?.rating ?? 0);
    setReview(initial?.review ?? "");
  }, [initial?.rating, initial?.review, row._id]);

  if (!course?._id) return null;

  const courseId = course._id;
  const avg = course.rating?.average ?? 0;
  const count = course.rating?.count ?? 0;

  async function handleSave() {
    if (stars < 1 || stars > 5) {
      setErr("Pick a rating from 1 to 5 stars.");
      return;
    }
    setSaving(true);
    setErr(null);
    setOk(false);
    try {
      await submitCourseRating(courseId, { rating: stars, review: review.trim() });
      setOk(true);
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border bg-[var(--app-surface)] shadow-sm transition hover:shadow-md"
      style={{ borderColor: "var(--app-border)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-56 sm:min-h-[140px]">
          <div
            className="absolute inset-0 bg-gradient-to-br from-violet-200 via-purple-100 to-fuchsia-100 dark:from-violet-950 dark:via-purple-900 dark:to-fuchsia-950"
          />
          {course.thumbnail ? (
            <img src={course.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />
          <span className="absolute bottom-2 left-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-white backdrop-blur sm:hidden">
            {course.category ?? "Course"}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:py-5 sm:pr-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)] sm:block">
                {course.category ?? "Course"}
              </p>
              <h3 className="mt-0.5 text-lg font-semibold leading-snug text-[var(--app-text)] sm:text-xl">
                {course.title}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--app-muted)]">
                All learners
              </span>
              <div className="flex items-center gap-2">
                <StarDisplay value={avg} />
                <span className="text-sm font-semibold tabular-nums text-[var(--app-text)]">
                  {avg > 0 ? avg.toFixed(1) : "—"}
                </span>
                <span className="text-xs text-[var(--app-muted)]">({count})</span>
              </div>
            </div>
          </div>

          <Separator.Root className="my-4 h-px bg-[var(--app-border)]" />

          <div className="space-y-3">
            <Label.Root className="text-sm font-medium text-[var(--app-text)]">Your rating</Label.Root>
            <StarPicker value={stars} onChange={setStars} />
            <div>
              <Label.Root htmlFor={`review-${courseId}`} className="text-xs text-[var(--app-muted)]">
                Review (optional)
              </Label.Root>
              <textarea
                id={`review-${courseId}`}
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share what helped you or what could improve…"
                className="mt-1 max-w-xl w-full resize-y rounded-xl border bg-[var(--app-page)] px-3 py-2 text-sm text-[var(--app-text)] outline-none ring-1 ring-[var(--app-border)] focus:ring-2 focus:ring-[var(--app-primary)]"
              />
            </div>
            {initial?.updatedAt && (
              <p className="text-xs text-[var(--app-muted)]">
                Last saved: {new Date(initial.updatedAt).toLocaleString()}
              </p>
            )}
            {err && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {err}
              </p>
            )}
            {ok && (
              <p className="text-sm font-medium" style={{ color: "var(--app-primary)" }}>
                Saved — thank you.
              </p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || stars < 1}
              className="w-full max-w-xs rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50 sm:w-auto sm:px-8"
              style={{ background: "var(--app-primary)" }}
            >
              {saving ? "Saving…" : initial ? "Update rating" : "Submit rating"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function RatingPage() {
  const { user } = useAuth();
  const token = user?.accessToken;
  const isCollaborator = user?.accountType === "collaborator";
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || user?.accountType === "collaborator") {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyEnrollments();
      setRows(res.enrollments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load enrollments");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.accountType]);

  useEffect(() => {
    load();
  }, [load]);

  if (!token) {
    return (
      <div
        className="rounded-2xl border px-6 py-12 text-center"
        style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
      >
        <p className="text-[var(--app-muted)]">
          Sign in with your account to view and manage course ratings.
        </p>
        <Link
          to={ROUTES.login}
          className="mt-4 inline-block text-sm font-semibold"
          style={{ color: "var(--app-primary)" }}
        >
          Go to login
        </Link>
      </div>
    );
  }

  if (isCollaborator) {
    return <CollaboratorRatingsManager />;
  }

  return (
    <div className="space-y-8 pb-12">
      <section
        className="relative overflow-hidden rounded-[1.75rem] px-6 py-8 text-white shadow-lg sm:px-10 sm:py-10"
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 45%, #5b21b6 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-2xl"
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Ratings</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          Rate the courses you&apos;re enrolled in
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-violet-100/95">
          Your stars and reviews help other students and teachers. You can update your rating anytime.
        </p>
      </section>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-[var(--app-border)]/40" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div
          className="rounded-2xl border border-dashed px-6 py-16 text-center"
          style={{ borderColor: "var(--app-border)" }}
        >
          <p className="text-[var(--app-muted)]">
            You don&apos;t have any active enrollments yet. Enroll in a course to leave a rating.
          </p>
          <Link
            to={ROUTES.dashboard.course}
            className="mt-4 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            style={{ background: "var(--app-primary)" }}
          >
            Browse courses
          </Link>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-6">
          {rows
            .filter((r) => r.course?._id)
            .map((row) => (
              <RatingCard key={row._id} row={row} onSaved={load} />
            ))}
        </div>
      )}
    </div>
  );
}
