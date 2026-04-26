import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
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

type VideoRow = {
  key: string;
  videoUrl: string;
  title: string;
  description: string;
  isActive: boolean;
};

function emptyVideoRow(): VideoRow {
  return {
    key: newRowKey(),
    videoUrl: "",
    title: "",
    description: "",
    isActive: true,
  };
}

type ChipListMode = "tags" | "lines";

function piecesFromDraft(raw: string, mode: ChipListMode): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (mode === "tags") {
    return trimmed
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  const byLine = trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
}

function ChipListField({
  id,
  label,
  items,
  onChange,
  placeholder,
  mode,
}: {
  id: string;
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  mode: ChipListMode;
}) {
  const [draft, setDraft] = useState("");

  function addFromDraft() {
    const pieces = piecesFromDraft(draft, mode);
    if (pieces.length === 0) return;
    const next = [...items];
    for (const p of pieces) {
      const exists =
        mode === "tags"
          ? next.some((x) => x.toLowerCase() === p.toLowerCase())
          : next.includes(p);
      if (!exists) next.push(p);
    }
    onChange(next);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <Label.Root htmlFor={id} className="text-sm font-medium text-[var(--app-text)]">
        {label}
      </Label.Root>
      <div
        className="rounded-xl border p-4 ring-1 ring-[var(--app-border)]"
        style={{ background: "var(--app-page)" }}
      >
        <div className="flex min-h-9 flex-wrap gap-2">
          {items.length === 0 ? (
            <span className="text-xs text-[var(--app-muted)]">No items yet — add below.</span>
          ) : (
            items.map((item, idx) => (
              <span
                key={`${idx}-${item.slice(0, 24)}`}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-1 pl-3 pr-1 text-sm text-[var(--app-text)] shadow-sm"
              >
                <span className="truncate" title={item}>
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, i) => i !== idx))}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--app-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            ))
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            id={id}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFromDraft();
              }
            }}
            placeholder={placeholder}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={addFromDraft}
            className="shrink-0 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            style={{ background: "var(--app-primary)" }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
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
  const [thumbnail, setThumbnail] = useState("");
  const [tagItems, setTagItems] = useState<string[]>([]);
  const [benefitsItems, setBenefitsItems] = useState<string[]>([]);
  const [prerequisitesItems, setPrerequisitesItems] = useState<string[]>([]);
  const [learningOutcomesItems, setLearningOutcomesItems] = useState<string[]>([]);
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
        setThumbnail(course.thumbnail ?? "");
        setTagItems(
          [...new Set((course.tags ?? []).map((t) => String(t).trim().toLowerCase()).filter(Boolean))],
        );
        setBenefitsItems([...(course.benefits ?? [])].map((s) => String(s).trim()).filter(Boolean));
        setPrerequisitesItems([...(course.prerequisites ?? [])].map((s) => String(s).trim()).filter(Boolean));
        setLearningOutcomesItems([...(course.learningOutcomes ?? [])].map((s) => String(s).trim()).filter(Boolean));
        setIsActive(course.isActive !== false);

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

    const videosPayload = videoRows
      .filter((row) => row.videoUrl.trim())
      .map((row) => ({
        videoUrl: row.videoUrl.trim(),
        title: row.title.trim() || undefined,
        description: row.description.trim() || undefined,
        isActive: row.isActive !== false,
      }));

    const body: AddCourseBody = {
      title: title.trim(),
      description: description.trim(),
      courseType,
      category: category.trim(),
      collaboratorId: resolvedCollaborator,
      identifierId: identifierId.trim() || null,
      thumbnail: thumbnail.trim() ? thumbnail.trim() : null,
      level,
      tags: tagItems.length ? tagItems : undefined,
      benefits: benefitsItems.length ? benefitsItems : undefined,
      prerequisites: prerequisitesItems.length ? prerequisitesItems : undefined,
      learningOutcomes: learningOutcomesItems.length ? learningOutcomesItems : undefined,
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
            Matches <code className="rounded bg-[var(--app-page)] px-1.5 py-0.5 text-xs">POST /api/v1/course</code> — course videos and metadata.
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

            <div className="sm:col-span-2">
              <ChipListField
                id="tags"
                label="Tags"
                items={tagItems}
                onChange={setTagItems}
                placeholder="Type a tag and tap Add — or several separated by commas"
                mode="tags"
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
          <p className="text-xs text-[var(--app-muted)]">
            Add items as chips — paste multiple lines or comma-separated values, then Add (or press Enter).
          </p>
          <div className="mt-5 grid gap-6 sm:grid-cols-1">
            <ChipListField
              id="benefits"
              label="Benefits"
              items={benefitsItems}
              onChange={setBenefitsItems}
              placeholder="e.g. Lifetime access"
              mode="lines"
            />
            <ChipListField
              id="prereq"
              label="Prerequisites"
              items={prerequisitesItems}
              onChange={setPrerequisitesItems}
              placeholder="e.g. Basic music theory"
              mode="lines"
            />
            <ChipListField
              id="outcomes"
              label="Learning outcomes"
              items={learningOutcomesItems}
              onChange={setLearningOutcomesItems}
              placeholder="e.g. Understand notation basics"
              mode="lines"
            />
          </div>
        </div>

        <div className={sectionClass} style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--app-text)]">Course videos</h3>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Stored as <code className="text-[11px]">CourseVideo</code> rows. Order follows this list (set on
                the server).
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
              No course videos yet. Add URLs to match your <code className="text-[11px]">videos[]</code> payload.
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
