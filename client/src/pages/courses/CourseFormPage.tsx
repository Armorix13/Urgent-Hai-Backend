import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createCourse,
  fetchCourseById,
  updateCourse,
  type AddCourseBody,
  type CourseCollaboratorRef,
  type CourseTypeNum,
} from "@/api/courseApi";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { readCollaboratorIdFromAccessToken } from "@/lib/jwtPayload";
import { ROUTES } from "@/routes/paths";

const levels = ["beginner", "intermediate", "advanced"] as const;

const inputClass =
  "w-full rounded-xl border bg-[var(--app-page)] px-4 py-3 text-sm text-[var(--app-text)] outline-none ring-1 ring-[var(--app-border)] focus:ring-2 focus:ring-[var(--app-primary)]";

const sectionClass =
  "space-y-5 rounded-2xl border p-6 sm:p-7";

function newRowKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function collaboratorRefToId(ref: CourseCollaboratorRef): string {
  if (!ref) return "";
  if (typeof ref === "string") return ref.trim();
  if (typeof ref === "object" && ref._id) return String(ref._id);
  return "";
}

type ContentRow = {
  key: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  isPreview: boolean;
};

type VideoRow = {
  key: string;
  videoUrl: string;
  title: string;
  description: string;
  isActive: boolean;
};

function emptyContentRow(): ContentRow {
  return {
    key: newRowKey(),
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
    isPreview: false,
  };
}

function emptyVideoRow(): VideoRow {
  return {
    key: newRowKey(),
    videoUrl: "",
    title: "",
    description: "",
    isActive: true,
  };
}

function splitLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CourseFormPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const isEdit = Boolean(courseId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.accessToken;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [identifierId, setIdentifierId] = useState("");
  const [collaboratorId, setCollaboratorId] = useState("");
  const [description, setDescription] = useState("");
  const [courseType, setCourseType] = useState<CourseTypeNum>(2);
  const [price, setPrice] = useState("0");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("beginner");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [tags, setTags] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [prerequisitesText, setPrerequisitesText] = useState("");
  const [learningOutcomesText, setLearningOutcomesText] = useState("");
  const [contentRows, setContentRows] = useState<ContentRow[]>([]);
  const [videoRows, setVideoRows] = useState<VideoRow[]>([]);
  const [isActive, setIsActive] = useState(true);
  /** Collaborator MongoDB `_id` from login: stored on user, or decoded from JWT if needed. */
  const sessionCollaboratorId = useMemo(() => {
    if (user?.accountType !== "collaborator") return "";
    const fromSession = user.collaboratorId?.trim();
    if (fromSession) return fromSession;
    return readCollaboratorIdFromAccessToken(user.accessToken)?.trim() ?? "";
  }, [user]);

  const collaboratorLocked = Boolean(sessionCollaboratorId);

  useEffect(() => {
    if (!sessionCollaboratorId) return;
    setCollaboratorId(sessionCollaboratorId);
  }, [sessionCollaboratorId]);

  useEffect(() => {
    if (!isEdit || !courseId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { course } = await fetchCourseById(courseId);
        if (cancelled) return;
        setTitle(course.title ?? "");
        setIdentifierId(course.identifierId ?? "");
        const loadedCol = collaboratorRefToId(course.collaborators);
        setCollaboratorId(
          user?.accountType === "collaborator" && sessionCollaboratorId
            ? sessionCollaboratorId
            : loadedCol,
        );
        setDescription(course.description ?? "");
        setCourseType(course.courseType === 1 ? 1 : 2);
        setPrice(String(course.price ?? 0));
        setCategory(course.category ?? "");
        setLevel(
          course.level && levels.includes(course.level as (typeof levels)[number])
            ? (course.level as (typeof levels)[number])
            : "beginner",
        );
        setDuration(course.duration ?? "");
        setThumbnail(course.thumbnail ?? "");
        setTags((course.tags ?? []).join(", "));
        setBenefitsText((course.benefits ?? []).join("\n"));
        setPrerequisitesText((course.prerequisites ?? []).join("\n"));
        setLearningOutcomesText((course.learningOutcomes ?? []).join("\n"));
        setIsActive(course.isActive !== false);

        const cc = [...(course.courseContent ?? [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        setContentRows(
          cc.length
            ? cc.map((item) => ({
                key: item._id ?? newRowKey(),
                title: item.title ?? "",
                description: item.description ?? "",
                videoUrl: item.videoUrl ?? "",
                duration: item.duration ?? "",
                isPreview: Boolean(item.isPreview),
              }))
            : [],
        );

        const vids = [...(course.videos ?? [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        setVideoRows(
          vids.length
            ? vids.map((v) => ({
                key: v._id ?? newRowKey(),
                videoUrl: v.videoUrl ?? "",
                title: v.title ?? "",
                description: v.description ?? "",
                isActive: v.isActive !== false,
              }))
            : [],
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load course");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, courseId, user?.accountType, sessionCollaboratorId]);

  function addContentRow() {
    setContentRows((rows) => [...rows, emptyContentRow()]);
  }

  function removeContentRow(key: string) {
    setContentRows((rows) => rows.filter((r) => r.key !== key));
  }

  function updateContentRow(key: string, patch: Partial<ContentRow>) {
    setContentRows((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function addVideoRow() {
    setVideoRows((rows) => [...rows, emptyVideoRow()]);
  }

  function removeVideoRow(key: string) {
    setVideoRows((rows) => rows.filter((r) => r.key !== key));
  }

  function updateVideoRow(key: string, patch: Partial<VideoRow>) {
    setVideoRows((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("You must be signed in with a valid token to save.");
      return;
    }

    const resolvedCollaborator = collaboratorLocked
      ? sessionCollaboratorId.trim()
      : collaboratorId.trim();

    if (!resolvedCollaborator) {
      setError(
        collaboratorLocked
          ? "Your session is missing your collaborator profile id. Sign out and sign in again."
          : "Collaborator ID is required — it links this course to your profile.",
      );
      return;
    }

    if (description.trim().length > 2000) {
      setError("Description must be at most 2000 characters.");
      return;
    }

    setSaving(true);
    setError(null);

    const tagList = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const courseContentPayload = contentRows
      .filter((row) => row.title.trim())
      .map((row) => ({
        title: row.title.trim(),
        description: row.description.trim() || undefined,
        videoUrl: row.videoUrl.trim() || undefined,
        duration: row.duration.trim() || undefined,
        isPreview: Boolean(row.isPreview),
      }));

    const videosPayload = videoRows
      .filter((row) => row.videoUrl.trim())
      .map((row) => ({
        videoUrl: row.videoUrl.trim(),
        title: row.title.trim() || undefined,
        description: row.description.trim() || undefined,
        isActive: row.isActive !== false,
      }));

    const benefits = splitLines(benefitsText);
    const prerequisites = splitLines(prerequisitesText);
    const learningOutcomes = splitLines(learningOutcomesText);

    const body: AddCourseBody = {
      title: title.trim(),
      description: description.trim(),
      courseType,
      category: category.trim(),
      collaboratorId: resolvedCollaborator,
      identifierId: identifierId.trim() || null,
      thumbnail: thumbnail.trim() ? thumbnail.trim() : null,
      duration: duration.trim() || undefined,
      level,
      tags: tagList.length ? tagList : undefined,
      benefits: benefits.length ? benefits : undefined,
      prerequisites: prerequisites.length ? prerequisites : undefined,
      learningOutcomes: learningOutcomes.length ? learningOutcomes : undefined,
      courseContent: courseContentPayload.length ? courseContentPayload : undefined,
      videos: videosPayload,
      isActive,
    };

    if (courseType === 1) {
      body.price = Math.max(0, Number(price) || 0);
    }

    try {
      if (isEdit && courseId) {
        await updateCourse(courseId, body);
      } else {
        await createCourse(body);
      }
      navigate(ROUTES.dashboard.course);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Save failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <div
        className="rounded-2xl border px-4 py-8 text-center"
        style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
      >
        <p className="text-[var(--app-muted)]">
          Sign in as a collaborator to {isEdit ? "edit" : "add"} courses.
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-[var(--app-border)]/50" />
        <div className="h-96 animate-pulse rounded-2xl bg-[var(--app-border)]/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">
            {isEdit ? "Edit course" : "Add course"}
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Matches <code className="rounded bg-[var(--app-page)] px-1.5 py-0.5 text-xs">POST /api/v1/course</code> — embed lessons, playlist videos, and metadata.
          </p>
        </div>
        <Link
          to={ROUTES.dashboard.course}
          className="text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)]"
        >
          ← Back to all courses
        </Link>
      </div>

      {error && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className={sectionClass} style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}>
          <h3 className="text-base font-semibold text-[var(--app-text)]">Basics</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label.Root htmlFor="title" className="text-sm font-medium text-[var(--app-text)]">
                Title <span className="text-red-500">*</span>
              </Label.Root>
              <input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label.Root htmlFor="identifierId" className="text-sm font-medium text-[var(--app-text)]">
                Identifier ID
              </Label.Root>
              <input
                id="identifierId"
                value={identifierId}
                onChange={(e) => setIdentifierId(e.target.value)}
                placeholder="e.g. EXT-1001"
                className={inputClass}
                maxLength={256}
              />
            </div>

            {!collaboratorLocked ? (
              <div className="space-y-2">
                <Label.Root htmlFor="collaboratorId" className="text-sm font-medium text-[var(--app-text)]">
                  Collaborator ID <span className="text-red-500">*</span>
                </Label.Root>
                <input
                  id="collaboratorId"
                  name="collaboratorId"
                  required
                  value={collaboratorId}
                  onChange={(e) => setCollaboratorId(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  title="Collaborator document _id this course is linked to"
                  placeholder="Paste collaborator MongoDB ObjectId"
                  className={`${inputClass} font-mono text-[13px] tracking-tight`}
                />
                <p className="text-xs text-[var(--app-muted)]">
                  Required: the collaborator document ID this course belongs to.
                </p>
              </div>
            ) : null}

            <div className="space-y-2 sm:col-span-2">
              <Label.Root htmlFor="description" className="text-sm font-medium text-[var(--app-text)]">
                Description <span className="text-red-500">*</span>
                <span className="ml-2 font-normal text-[var(--app-muted)]">(max 2000)</span>
              </Label.Root>
              <textarea
                id="description"
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                className={`${inputClass} resize-y min-h-[120px]`}
              />
            </div>

            <div className="space-y-2">
              <Label.Root className="text-sm font-medium text-[var(--app-text)]">Course type</Label.Root>
              <Select.Root
                value={String(courseType)}
                onValueChange={(v) => setCourseType(Number(v) as CourseTypeNum)}
              >
                <Select.Trigger
                  className={`flex h-12 w-full items-center justify-between rounded-xl border bg-[var(--app-page)] px-4 text-sm text-[var(--app-text)] outline-none ring-1 ring-[var(--app-border)] focus:ring-2 focus:ring-[var(--app-primary)]`}
                  aria-label="Course type"
                >
                  <Select.Value />
                  <Select.Icon className="text-[var(--app-muted)]">▾</Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-[200] overflow-hidden rounded-xl border bg-[var(--app-surface)] shadow-xl"
                    style={{ borderColor: "var(--app-border)" }}
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="1"
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--app-page)]"
                      >
                        <Select.ItemText>Paid (1)</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="2"
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--app-page)]"
                      >
                        <Select.ItemText>Free (2)</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {courseType === 1 && (
              <div className="space-y-2">
                <Label.Root htmlFor="price" className="text-sm font-medium text-[var(--app-text)]">
                  Price <span className="text-red-500">*</span>
                </Label.Root>
                <input
                  id="price"
                  type="number"
                  min={0}
                  step={1}
                  required={courseType === 1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label.Root htmlFor="category" className="text-sm font-medium text-[var(--app-text)]">
                Category <span className="text-red-500">*</span>
              </Label.Root>
              <input
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Classical"
                className={inputClass}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label.Root className="text-sm font-medium text-[var(--app-text)]">Level</Label.Root>
              <Select.Root value={level} onValueChange={(v) => setLevel(v as (typeof levels)[number])}>
                <Select.Trigger
                  className="flex h-12 w-full items-center justify-between rounded-xl border bg-[var(--app-page)] px-4 text-sm capitalize outline-none ring-1 ring-[var(--app-border)] focus:ring-2 focus:ring-[var(--app-primary)]"
                  aria-label="Level"
                >
                  <Select.Value />
                  <Select.Icon className="text-[var(--app-muted)]">▾</Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-[200] overflow-hidden rounded-xl border bg-[var(--app-surface)] shadow-xl"
                    style={{ borderColor: "var(--app-border)" }}
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.Viewport className="p-1">
                      {levels.map((l) => (
                        <Select.Item
                          key={l}
                          value={l}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm capitalize outline-none data-[highlighted]:bg-[var(--app-page)]"
                        >
                          <Select.ItemText>{l}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="space-y-2">
              <Label.Root htmlFor="duration" className="text-sm font-medium text-[var(--app-text)]">
                Duration
              </Label.Root>
              <input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 10h"
                className={inputClass}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label.Root htmlFor="thumbnail" className="text-sm font-medium text-[var(--app-text)]">
                Thumbnail URL
              </Label.Root>
              <input
                id="thumbnail"
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://… or leave empty for null"
                className={inputClass}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label.Root htmlFor="tags" className="text-sm font-medium text-[var(--app-text)]">
                Tags (comma-separated)
              </Label.Root>
              <input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="raag, beginner"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((v) => !v)}
                className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
                style={{ background: isActive ? "var(--app-primary)" : "var(--app-border)" }}
              >
                <span
                  className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: isActive ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
              <Label.Root className="text-sm text-[var(--app-text)]">Active (visible to learners)</Label.Root>
            </div>
          </div>
        </div>

        <div className={sectionClass} style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}>
          <h3 className="text-base font-semibold text-[var(--app-text)]">Benefits, prerequisites, outcomes</h3>
          <p className="text-xs text-[var(--app-muted)]">One line per item.</p>
          <div className="grid gap-5 sm:grid-cols-1">
            <div className="space-y-2">
              <Label.Root htmlFor="benefits" className="text-sm font-medium text-[var(--app-text)]">
                Benefits
              </Label.Root>
              <textarea
                id="benefits"
                rows={3}
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                placeholder={"Lifetime access\nCommunity Q&A"}
                className={`${inputClass} resize-y min-h-[80px]`}
              />
            </div>
            <div className="space-y-2">
              <Label.Root htmlFor="prereq" className="text-sm font-medium text-[var(--app-text)]">
                Prerequisites
              </Label.Root>
              <textarea
                id="prereq"
                rows={3}
                value={prerequisitesText}
                onChange={(e) => setPrerequisitesText(e.target.value)}
                className={`${inputClass} resize-y min-h-[80px]`}
              />
            </div>
            <div className="space-y-2">
              <Label.Root htmlFor="outcomes" className="text-sm font-medium text-[var(--app-text)]">
                Learning outcomes
              </Label.Root>
              <textarea
                id="outcomes"
                rows={3}
                value={learningOutcomesText}
                onChange={(e) => setLearningOutcomesText(e.target.value)}
                placeholder={"Understand basics\nRead notation"}
                className={`${inputClass} resize-y min-h-[80px]`}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass} style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--app-text)]">Course content (embedded lessons)</h3>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Stored on the course document as <code className="text-[11px]">courseContent[]</code>. Order
                follows the list (set on the server).
              </p>
            </div>
            <button
              type="button"
              onClick={addContentRow}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-page)]"
              style={{ borderColor: "var(--app-border)" }}
            >
              + Add lesson
            </button>
          </div>

          {contentRows.length === 0 ? (
            <p className="rounded-xl border border-dashed py-8 text-center text-sm text-[var(--app-muted)]" style={{ borderColor: "var(--app-border)" }}>
              No embedded lessons yet. Add one to match your API payload.
            </p>
          ) : (
            <ul className="space-y-4">
              {contentRows.map((row, idx) => (
                <li
                  key={row.key}
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--app-border)", background: "var(--app-page)" }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                      Lesson {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeContentRow(row.key)}
                      className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label.Root className="text-xs text-[var(--app-muted)]">Title *</Label.Root>
                      <input
                        value={row.title}
                        onChange={(e) => updateContentRow(row.key, { title: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label.Root className="text-xs text-[var(--app-muted)]">Description</Label.Root>
                      <input
                        value={row.description}
                        onChange={(e) => updateContentRow(row.key, { description: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label.Root className="text-xs text-[var(--app-muted)]">Video URL</Label.Root>
                      <input
                        value={row.videoUrl}
                        onChange={(e) => updateContentRow(row.key, { videoUrl: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label.Root className="text-xs text-[var(--app-muted)]">Duration</Label.Root>
                      <input
                        value={row.duration}
                        onChange={(e) => updateContentRow(row.key, { duration: e.target.value })}
                        placeholder="12m"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        id={`preview-${row.key}`}
                        type="checkbox"
                        checked={row.isPreview}
                        onChange={(e) => updateContentRow(row.key, { isPreview: e.target.checked })}
                        className="h-4 w-4 rounded border-[var(--app-border)]"
                      />
                      <Label.Root htmlFor={`preview-${row.key}`} className="text-sm text-[var(--app-text)]">
                        Preview lesson
                      </Label.Root>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={sectionClass} style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--app-text)]">Playlist videos</h3>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Synced as <code className="text-[11px]">CourseVideo</code> rows. Order follows this list
                (set on the server).
              </p>
            </div>
            <button
              type="button"
              onClick={addVideoRow}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-page)]"
              style={{ borderColor: "var(--app-border)" }}
            >
              + Add video
            </button>
          </div>

          {videoRows.length === 0 ? (
            <p className="rounded-xl border border-dashed py-8 text-center text-sm text-[var(--app-muted)]" style={{ borderColor: "var(--app-border)" }}>
              No playlist rows. Add URLs to match your <code className="text-[11px]">videos[]</code> payload.
            </p>
          ) : (
            <ul className="space-y-4">
              {videoRows.map((row, idx) => (
                <li
                  key={row.key}
                  className="rounded-xl border p-4"
                  style={{ borderColor: "var(--app-border)", background: "var(--app-page)" }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                      Video {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVideoRow(row.key)}
                      className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label.Root className="text-xs text-[var(--app-muted)]">Video URL *</Label.Root>
                      <input
                        value={row.videoUrl}
                        onChange={(e) => updateVideoRow(row.key, { videoUrl: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label.Root className="text-xs text-[var(--app-muted)]">Title</Label.Root>
                      <input
                        value={row.title}
                        onChange={(e) => updateVideoRow(row.key, { title: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label.Root className="text-xs text-[var(--app-muted)]">Description</Label.Root>
                      <input
                        value={row.description}
                        onChange={(e) => updateVideoRow(row.key, { description: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        id={`active-${row.key}`}
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(e) => updateVideoRow(row.key, { isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-[var(--app-border)]"
                      />
                      <Label.Root htmlFor={`active-${row.key}`} className="text-sm text-[var(--app-text)]">
                        Active
                      </Label.Root>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-3 border-t pt-6" style={{ borderColor: "var(--app-border)" }}>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
            style={{ background: "var(--app-primary)" }}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create course"}
          </button>
          <Link
            to={ROUTES.dashboard.course}
            className="rounded-2xl border px-8 py-3 text-sm font-semibold transition hover:bg-[var(--app-page)]"
            style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
