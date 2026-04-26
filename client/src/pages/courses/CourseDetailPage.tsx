import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Hash,
  Layers,
  ListVideo,
  Play,
  PlayCircle,
  Sparkles,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";
import { ROUTES, courseDetailPath, courseEditPath } from "@/routes/paths";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCourseById,
  type Course,
  type CourseRatingEntry,
  type CourseVideoRow,
} from "@/api/courseApi";
import { fetchMyEnrollments, type EnrollmentRow } from "@/api/enrollmentApi";
import { buildCourseThumbnailCandidates, buildVideoPosterUrls, getYoutubeEmbedUrl } from "@/lib/youtubeThumbnail";

type DetailTab = "overview" | "videos" | "enrollments" | "ratings";

function StarRating({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const v = Math.min(5, Math.max(0, value));
  const rounded = Math.round(v * 2) / 2;
  const starClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${v} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const full = i + 1 <= rounded;
        const half = !full && i + 0.5 <= rounded;
        return (
          <span key={i} className={`${starClass} leading-none ${full || half ? "text-amber-400" : "text-[var(--app-border)]"}`}>
            ★
          </span>
        );
      })}
    </div>
  );
}

function formatShortDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function collaboratorLabel(ref: Course["collaborators"]): string {
  if (!ref) return "";
  if (typeof ref === "string") return "Collaborator";
  return ref.name || ref.email || "Collaborator";
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">{label}</p>
          <p className="mt-0.5 truncate text-lg font-semibold text-[var(--app-text)]">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-[var(--app-muted)]">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-[var(--app-text)]">{title}</h2>
    </div>
  );
}

function CourseHeroImage({ course }: { course: Course }) {
  const [idx, setIdx] = useState(0);
  const candidates = useMemo(() => buildCourseThumbnailCandidates(course), [course]);
  const src = candidates[idx] ?? null;

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)]">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <PlayCircle className="h-12 w-12 opacity-40" aria-hidden />
          <p className="text-sm">No thumbnail or preview video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-black shadow-lg">
      <img
        src={src}
        alt=""
        className="aspect-video w-full object-cover"
        loading="lazy"
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}

function VideoThumbnailCard({
  video,
  index,
  onPlay,
}: {
  video: CourseVideoRow;
  index: number;
  onPlay: () => void;
}) {
  const [thumbIdx, setThumbIdx] = useState(0);
  const posters = useMemo(() => buildVideoPosterUrls(video.videoUrl), [video.videoUrl]);
  const thumb = posters[thumbIdx] ?? null;
  const title = video.title?.trim() || `Video ${index + 1}`;

  return (
    <button
      type="button"
      onClick={onPlay}
      className="group relative w-full overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-left shadow-sm transition hover:border-[var(--app-accent)]/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--app-surface-muted)]">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
            loading="lazy"
            onError={() => setThumbIdx((i) => i + 1)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--app-accent-soft)] to-[var(--app-surface-muted)]">
            <PlayCircle className="h-14 w-14 text-[var(--app-accent)]" aria-hidden />
          </div>
        )}
        {/* Always-visible play control: dark icon on solid light circle (readable in light + dark app themes). */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.45)] ring-2 ring-black/15 transition duration-300 ease-out group-hover:scale-110 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.55)] dark:ring-white/25"
          >
            <Play
              className="ml-0.5 h-7 w-7 shrink-0 text-zinc-900"
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
          </span>
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/30"
          aria-hidden
        />
      </div>
      <div className="p-4">
        <p className="line-clamp-2 font-semibold text-[var(--app-text)]">{title}</p>
        {video.description?.trim() ? (
          <p className="mt-1 line-clamp-2 text-sm text-[var(--app-muted)]">{video.description.trim()}</p>
        ) : null}
        {video.videoUrl ? (
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--app-text)] underline-offset-2 group-hover:text-[var(--app-accent)] group-hover:underline">
            Watch
            <Play className="h-3.5 w-3.5 shrink-0 text-[var(--app-text)] group-hover:text-[var(--app-accent)]" fill="currentColor" strokeWidth={0} aria-hidden />
          </span>
        ) : null}
      </div>
    </button>
  );
}

function RatingFlipCard({ r }: { r: CourseRatingEntry }) {
  const [flipped, setFlipped] = useState(false);
  const name = r.user?.userName?.trim() || "Learner";
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const review = r.review?.trim() ?? "";

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="relative h-56 w-full text-left [perspective:1200px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)]"
      aria-expanded={flipped}
    >
      <div
        className={`relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-[var(--app-border)] bg-gradient-to-br from-[var(--app-surface)] via-[var(--app-surface)] to-[var(--app-accent-soft)] p-5 shadow-sm [backface-visibility:hidden]">
          <div className="flex items-start justify-between gap-3">
            {r.user?.profileImage ? (
              <img src={r.user.profileImage} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-[var(--app-border)]" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-accent)] text-sm font-bold text-[var(--app-accent-contrast)]">
                {initials}
              </div>
            )}
            <div className="text-right">
              <StarRating value={r.rating} size="sm" />
              <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--app-text)]">{r.rating.toFixed(1)}</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-[var(--app-text)]">{name}</p>
            <p className="mt-1 text-xs text-[var(--app-muted)]">{formatShortDate(r.updatedAt ?? r.createdAt)}</p>
            <p className="mt-3 text-xs font-medium text-[var(--app-accent)]">Tap to read the full review →</p>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--app-text)]">{name}</p>
            <StarRating value={r.rating} size="sm" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {review ? (
              <p className="text-sm leading-relaxed text-[var(--app-muted)]">{review}</p>
            ) : (
              <p className="text-sm italic text-[var(--app-muted)]">No written review — stars only.</p>
            )}
          </div>
          <p className="mt-3 text-xs text-[var(--app-muted)]">Tap to flip back</p>
        </div>
      </div>
    </button>
  );
}

function enrollmentMatchesCourse(row: EnrollmentRow, courseId: string): boolean {
  const id = row.course?._id;
  if (!id) return false;
  return String(id) === String(courseId);
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const isCollaborator = user?.accountType === "collaborator";
  const isLearner = Boolean(user && !isCollaborator);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [playVideo, setPlayVideo] = useState<CourseVideoRow | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollRows, setEnrollRows] = useState<EnrollmentRow[] | null>(null);
  const [enrollErr, setEnrollErr] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchCourseById(courseId);
        if (!cancelled) setCourse(res.course);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load course");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const loadEnrollments = useCallback(async () => {
    if (!isLearner) return;
    setEnrollLoading(true);
    setEnrollErr(null);
    try {
      const res = await fetchMyEnrollments();
      setEnrollRows(res.enrollments ?? []);
    } catch (e) {
      setEnrollErr(e instanceof Error ? e.message : "Could not load enrollments");
      setEnrollRows(null);
    } finally {
      setEnrollLoading(false);
    }
  }, [isLearner]);

  useEffect(() => {
    if (!enrollOpen || !isLearner) return;
    loadEnrollments();
  }, [enrollOpen, isLearner, loadEnrollments]);

  const videos = course?.videos ?? [];
  const reviews = course?.courseRatings ?? [];
  const avgRating = course?.rating?.average ?? 0;
  const ratingCount = course?.rating?.count ?? 0;
  const enrollments = course?.enrollmentCount ?? 0;
  const videoCount = course?.videoCount ?? videos.length;

  const myEnrollmentRow = useMemo(() => {
    if (!course || !enrollRows) return null;
    return enrollRows.find((r) => enrollmentMatchesCourse(r, course._id)) ?? null;
  }, [course, enrollRows]);

  const playEmbed = playVideo ? getYoutubeEmbedUrl(playVideo.videoUrl) : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-4 w-40 animate-pulse rounded bg-[var(--app-surface-muted)]" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
          <div className="space-y-4">
            <div className="h-10 w-3/4 max-w-md animate-pulse rounded bg-[var(--app-surface-muted)]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[var(--app-surface-muted)]" />
          </div>
          <div className="aspect-video animate-pulse rounded-2xl bg-[var(--app-surface-muted)]" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          to={ROUTES.dashboard.course}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--app-accent)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All courses
        </Link>
        <div className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-[var(--app-text)]">
          <p className="font-medium">{error ?? "Course not found."}</p>
        </div>
      </div>
    );
  }

  const typeLabel = course.courseTypeName ?? (course.courseType === 1 ? "Paid" : "Free");
  const levelLabel = course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : null;

  const tabs: { id: DetailTab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "videos", label: "Videos", count: videos.length },
    { id: "enrollments", label: "Enrollments" },
    { id: "ratings", label: "Ratings", count: reviews.length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--app-muted)]">
        <Link to={ROUTES.dashboard.course} className="inline-flex items-center gap-1 font-medium text-[var(--app-accent)] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Courses
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-[var(--app-text)]">{course.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,440px)] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--app-text)]">
              {typeLabel}
            </span>
            {course.isActive === false ? (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                Inactive
              </span>
            ) : null}
            {course.isEnrolled ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                You&apos;re enrolled
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">{course.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--app-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-4 w-4" aria-hidden />
              {course.category}
            </span>
            {course.identifierId ? (
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-4 w-4" aria-hidden />
                {course.identifierId}
              </span>
            ) : null}
            {levelLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" aria-hidden />
                {levelLabel}
              </span>
            ) : null}
            {course.duration ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden />
                {course.duration}
              </span>
            ) : null}
          </div>

          {isCollaborator ? (
            <div className="mt-6">
              <Link
                to={courseEditPath(course._id)}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--app-accent-contrast)] shadow-sm transition hover:opacity-95"
              >
                Edit course
              </Link>
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-6">
          <CourseHeroImage course={course} />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Enrollments" value={enrollments.toLocaleString()} sub="Total learners" />
        <StatCard
          icon={Star}
          label="Rating"
          value={ratingCount > 0 ? avgRating.toFixed(1) : "—"}
          sub={ratingCount > 0 ? `${ratingCount} review${ratingCount === 1 ? "" : "s"}` : "No reviews yet"}
        />
        <StatCard icon={ListVideo} label="Videos" value={String(videoCount)} sub="Course videos" />
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/80 p-2 backdrop-blur-sm">
        <div
          role="tablist"
          aria-label="Course sections"
          className="flex flex-wrap gap-1 sm:gap-2"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              id={`tab-${t.id}`}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm ring-1 ring-[var(--app-border)]"
                  : "text-[var(--app-muted)] hover:bg-[var(--app-surface)]/60 hover:text-[var(--app-text)]"
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 ? (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
                    tab === t.id ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)]" : "bg-[var(--app-border)]/40"
                  }`}
                >
                  {t.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-8">
            {ratingCount > 0 ? (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                <StarRating value={avgRating} />
                <span className="text-sm text-[var(--app-muted)]">
                  <span className="font-semibold text-[var(--app-text)]">{avgRating.toFixed(1)}</span> average from{" "}
                  {ratingCount.toLocaleString()} rating{ratingCount === 1 ? "" : "s"}
                </span>
              </div>
            ) : null}

            {course.myRating != null && typeof course.myRating.rating === "number" ? (
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">Your rating</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <StarRating value={course.myRating.rating} />
                  {course.myRating.review?.trim() ? (
                    <p className="text-sm text-[var(--app-text)]">{course.myRating.review.trim()}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 lg:col-span-2">
                <SectionTitle icon={Sparkles} title="About this course" />
                {course.description?.trim() ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-muted)]">{course.description.trim()}</p>
                ) : (
                  <p className="text-sm text-[var(--app-muted)]">No description provided.</p>
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
                <h3 className="text-sm font-semibold text-[var(--app-text)]">Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--app-muted)]">Price</dt>
                    <dd className="text-right font-medium text-[var(--app-text)]">
                      {course.courseType === 2
                        ? "Free"
                        : course.price != null
                          ? `$${Number(course.price).toFixed(2)}`
                          : "Paid"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--app-muted)]">Created</dt>
                    <dd className="text-right text-[var(--app-text)]">{formatShortDate(course.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--app-muted)]">Updated</dt>
                    <dd className="text-right text-[var(--app-text)]">{formatShortDate(course.updatedAt)}</dd>
                  </div>
                  {collaboratorLabel(course.collaborators) ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--app-muted)]">Collaborator</dt>
                      <dd className="text-right text-[var(--app-text)]">{collaboratorLabel(course.collaborators)}</dd>
                    </div>
                  ) : null}
                </dl>
                {course.tags?.length ? (
                  <div className="mt-4 border-t border-[var(--app-border)] pt-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
                      <Tag className="h-3.5 w-3.5" aria-hidden />
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag) => (
                        <span key={tag} className="rounded-lg bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs text-[var(--app-text)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {(course.benefits?.length || course.prerequisites?.length || course.learningOutcomes?.length) ? (
              <div className="grid gap-6 md:grid-cols-3">
                {course.benefits?.length ? (
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
                    <SectionTitle icon={CheckCircle2} title="Benefits" />
                    <ul className="space-y-2">
                      {course.benefits.map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[var(--app-muted)]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {course.prerequisites?.length ? (
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
                    <SectionTitle icon={BookOpen} title="Prerequisites" />
                    <ul className="space-y-2">
                      {course.prerequisites.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[var(--app-muted)]">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-accent)]" aria-hidden />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {course.learningOutcomes?.length ? (
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
                    <SectionTitle icon={GraduationCap} title="Learning outcomes" />
                    <ul className="space-y-2">
                      {course.learningOutcomes.map((o, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[var(--app-muted)]">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-accent)]" aria-hidden />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {tab === "videos" && (
          <div id="panel-videos" role="tabpanel" aria-labelledby="tab-videos">
            {videos.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {videos.map((v, i) => (
                  <VideoThumbnailCard key={v._id ?? i} video={v} index={i} onPlay={() => setPlayVideo(v)} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-10 text-center text-sm text-[var(--app-muted)]">
                No videos attached to this course.
              </p>
            )}
          </div>
        )}

        {tab === "enrollments" && (
          <div id="panel-enrollments" role="tabpanel" aria-labelledby="tab-enrollments" className="space-y-6">
            <div className="rounded-2xl border border-[var(--app-border)] bg-gradient-to-br from-[var(--app-surface)] to-[var(--app-accent-soft)] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--app-surface)] text-[var(--app-accent)] shadow-sm">
                  <Users className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--app-muted)]">Total enrollments</p>
                  <p className="text-3xl font-bold tabular-nums text-[var(--app-text)]">{enrollments.toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--app-muted)]">Everyone actively learning on this course across the platform.</p>
            </div>

            <Dialog.Root open={enrollOpen} onOpenChange={setEnrollOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="w-full max-w-md rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
                >
                  {isCollaborator ? "Enrollment info" : "Check enrollment details"}
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                  <div className="flex items-start justify-between gap-4">
                    <Dialog.Title className="text-lg font-semibold text-[var(--app-text)]">Enrollment</Dialog.Title>
                    <Dialog.Close
                      className="rounded-lg p-1.5 text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </Dialog.Close>
                  </div>
                  <Dialog.Description className="mt-2 text-sm text-[var(--app-muted)]">
                    {course.title}
                  </Dialog.Description>

                  <div className="mt-6 space-y-4 text-sm">
                    {isCollaborator ? (
                      <p className="leading-relaxed text-[var(--app-muted)]">
                        Collaborators see aggregate enrollment counts only. This course currently has{" "}
                        <strong className="text-[var(--app-text)]">{enrollments.toLocaleString()}</strong> enrollments.
                      </p>
                    ) : !user ? (
                      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                        <p className="text-[var(--app-text)]">Sign in as a learner to view your enrollment record.</p>
                        <Link
                          to={ROUTES.login}
                          className="mt-3 inline-flex rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-[var(--app-accent-contrast)]"
                        >
                          Go to login
                        </Link>
                      </div>
                    ) : enrollLoading ? (
                      <div className="flex items-center gap-3 py-8 text-[var(--app-muted)]">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-[var(--app-accent)]" />
                        Loading your enrollments…
                      </div>
                    ) : enrollErr ? (
                      <p className="text-red-600 dark:text-red-400">{enrollErr}</p>
                    ) : myEnrollmentRow ? (
                      <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                        <p className="font-semibold text-emerald-800 dark:text-emerald-200">You&apos;re enrolled in this course</p>
                        <dl className="grid gap-2 text-[var(--app-muted)]">
                          <div className="flex justify-between gap-4">
                            <dt>Enrolled</dt>
                            <dd className="text-right font-medium text-[var(--app-text)]">{formatShortDate(myEnrollmentRow.enrolledAt)}</dd>
                          </div>
                          {myEnrollmentRow.enrollmentType ? (
                            <div className="flex justify-between gap-4">
                              <dt>Type</dt>
                              <dd className="text-right font-medium capitalize text-[var(--app-text)]">{myEnrollmentRow.enrollmentType}</dd>
                            </div>
                          ) : null}
                          {myEnrollmentRow.expiresAt ? (
                            <div className="flex justify-between gap-4">
                              <dt>Access until</dt>
                              <dd className="text-right font-medium text-[var(--app-text)]">{formatShortDate(myEnrollmentRow.expiresAt)}</dd>
                            </div>
                          ) : null}
                          {myEnrollmentRow.progress?.completionPercentage != null ? (
                            <div className="flex justify-between gap-4">
                              <dt>Progress</dt>
                              <dd className="text-right font-medium text-[var(--app-text)]">
                                {Math.round(myEnrollmentRow.progress.completionPercentage)}%
                              </dd>
                            </div>
                          ) : null}
                          {myEnrollmentRow.progress?.lastAccessedAt ? (
                            <div className="flex justify-between gap-4">
                              <dt>Last activity</dt>
                              <dd className="text-right font-medium text-[var(--app-text)]">
                                {formatShortDate(myEnrollmentRow.progress.lastAccessedAt)}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                        <Link
                          to={ROUTES.dashboard.rating}
                          className="inline-flex text-sm font-semibold text-[var(--app-accent)] hover:underline"
                        >
                          Manage ratings →
                        </Link>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                        <p className="text-[var(--app-text)]">You don&apos;t have an active enrollment for this course yet.</p>
                        <p className="mt-2 text-[var(--app-muted)]">Enroll through your usual flow; this dashboard will update when you&apos;re registered.</p>
                      </div>
                    )}
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        )}

        {tab === "ratings" && (
          <div id="panel-ratings" role="tabpanel" aria-labelledby="tab-ratings" className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
                <p className="text-sm font-medium text-[var(--app-muted)]">Course average</p>
                <p className="mt-2 text-5xl font-bold tabular-nums text-[var(--app-text)]">
                  {ratingCount > 0 ? avgRating.toFixed(1) : "—"}
                </p>
                <div className="mt-3">
                  <StarRating value={avgRating} size="lg" />
                </div>
                <p className="mt-4 text-sm text-[var(--app-muted)]">
                  Based on <span className="font-semibold text-[var(--app-text)]">{ratingCount.toLocaleString()}</span> rating
                  {ratingCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/50 p-6">
                <h3 className="text-sm font-semibold text-[var(--app-text)]">Recent reviews</h3>
                <p className="mt-1 text-xs text-[var(--app-muted)]">Flip cards — tap a card to read the full review.</p>
                {reviews.length > 0 ? (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {reviews.map((r) => (
                      <RatingFlipCard key={r._id} r={r} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-center text-sm text-[var(--app-muted)]">
                    No reviews yet. Learner ratings will appear here as flip cards.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-5 py-4 text-sm text-[var(--app-muted)]">
        <span className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4" aria-hidden />
          Last updated {formatShortDate(course.updatedAt)}
        </span>
        <Link to={courseDetailPath(course._id)} className="font-mono text-xs text-[var(--app-muted)]" title="Course id">
          ID: {course._id}
        </Link>
      </div>

      <Dialog.Root open={playVideo != null} onOpenChange={(o) => !o && setPlayVideo(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black p-4 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="pr-8 text-lg font-semibold text-white">
                {playVideo?.title?.trim() || "Video"}
              </Dialog.Title>
              <Dialog.Close
                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close player"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl bg-black">
              {playEmbed ? (
                <div className="aspect-video w-full">
                  <iframe
                    title={playVideo?.title ?? "Video"}
                    src={playEmbed}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : playVideo?.videoUrl ? (
                <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center text-white/90">
                  <p className="text-sm">This link isn&apos;t a YouTube watch URL. Open it in your browser instead.</p>
                  <a
                    href={playVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Open video
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center text-white/60">No video URL</div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
