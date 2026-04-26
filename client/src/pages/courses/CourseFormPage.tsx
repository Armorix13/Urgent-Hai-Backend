import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { GripHorizontal, Play, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buildVideoPosterUrls, extractYoutubeVideoId, getYoutubeEmbedUrl } from "@/lib/youtubeThumbnail";
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

function CourseFormVideoRowCard({
  row,
  index,
  inputClass: ic,
  dragHandle,
  onChangeUrl,
  onChangeTitle,
  onChangeDescription,
  onChangeActive,
  onRemove,
}: {
  row: VideoRow;
  index: number;
  inputClass: string;
  dragHandle?: {
    attributes: DraggableAttributes;
    listeners: DraggableSyntheticListeners;
  };
  onChangeUrl: (v: string) => void;
  onChangeTitle: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onChangeActive: (v: boolean) => void;
  onRemove: () => void;
}) {
  const [thumbIdx, setThumbIdx] = useState(0);
  const [urlEditorOpen, setUrlEditorOpen] = useState(() => {
    const t = row.videoUrl.trim();
    if (!t) return true;
    return extractYoutubeVideoId(row.videoUrl) == null;
  });
  const [playOpen, setPlayOpen] = useState(false);

  const trimmedUrl = row.videoUrl.trim();
  const posters = useMemo(() => buildVideoPosterUrls(row.videoUrl), [row.videoUrl]);
  const embed = useMemo(() => getYoutubeEmbedUrl(row.videoUrl), [row.videoUrl]);
  const ytId = useMemo(() => extractYoutubeVideoId(row.videoUrl), [row.videoUrl]);

  useEffect(() => {
    setThumbIdx(0);
  }, [trimmedUrl]);

  useEffect(() => {
    if (!trimmedUrl) {
      setUrlEditorOpen(true);
      return;
    }
    if (!ytId) setUrlEditorOpen(true);
  }, [trimmedUrl, ytId]);

  function onUrlBlur() {
    if (ytId && trimmedUrl) setUrlEditorOpen(false);
  }

  const showYoutubePreview = posters.length > 0 && Boolean(trimmedUrl);
  const hasNonYoutubeUrl = Boolean(trimmedUrl) && !ytId;
  const thumbSrc = posters[thumbIdx];

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--app-border)", background: "var(--app-page)" }}
    >
      <div className="flex gap-3 sm:gap-4">
        {dragHandle ? (
          <button
            type="button"
            className="flex min-h-[3.5rem] w-10 shrink-0 touch-none cursor-grab flex-col items-center justify-center gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-muted)] select-none hover:bg-[var(--app-surface)] active:cursor-grabbing"
            aria-label={`Drag to reorder video ${index + 1}`}
            {...dragHandle.attributes}
            {...dragHandle.listeners}
          >
            <GripHorizontal className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            <span className="text-[11px] font-bold tabular-nums text-[var(--app-text)]">{index + 1}</span>
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
            >
              Remove
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
        <div className="space-y-3">
          {showYoutubePreview ? (
            <button
              type="button"
              onClick={() => embed && setPlayOpen(true)}
              className="group relative w-full overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-left shadow-sm ring-1 ring-[var(--app-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.02]"
                    loading="lazy"
                    onError={() => setThumbIdx((i) => i + 1)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--app-muted)]">
                    Thumbnail unavailable
                  </div>
                )}
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  aria-hidden
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.35)] ring-2 ring-black/10 dark:ring-white/20">
                    <Play className="ml-0.5 h-7 w-7 text-zinc-900" fill="currentColor" strokeWidth={0} />
                  </span>
                </div>
                <div
                  className="pointer-events-none absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20"
                  aria-hidden
                />
              </div>
              <p className="px-2 py-2 text-center text-xs text-[var(--app-muted)]">Tap to play preview</p>
            </button>
          ) : hasNonYoutubeUrl ? (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-center text-xs text-[var(--app-muted)]">
              <p className="font-medium text-[var(--app-text)]">No thumbnail for this URL</p>
              <p>Use a YouTube link to see a preview, or change the link below.</p>
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 text-center text-xs text-[var(--app-muted)]">
              Add a YouTube URL below — a thumbnail and player preview will appear here.
            </div>
          )}

          {urlEditorOpen ? (
            <div className="space-y-1">
              <Label.Root className="text-xs text-[var(--app-muted)]">Video URL *</Label.Root>
              <input
                value={row.videoUrl}
                onChange={(e) => onChangeUrl(e.target.value)}
                onBlur={onUrlBlur}
                placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
                className={ic}
              />
              {showYoutubePreview ? (
                <button
                  type="button"
                  onClick={() => setUrlEditorOpen(false)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--app-primary)" }}
                >
                  Hide URL — preview only
                </button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setUrlEditorOpen(true)}
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--app-primary)" }}
            >
              Change video link
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label.Root className="text-xs text-[var(--app-muted)]">Title</Label.Root>
            <input
              value={row.title}
              onChange={(e) => onChangeTitle(e.target.value)}
              className={ic}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label.Root className="text-xs text-[var(--app-muted)]">Description</Label.Root>
            <textarea
              value={row.description}
              onChange={(e) => onChangeDescription(e.target.value)}
              rows={3}
              className={`${ic} resize-y min-h-[72px]`}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id={`active-${row.key}`}
              type="checkbox"
              checked={row.isActive}
              onChange={(e) => onChangeActive(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--app-border)]"
            />
            <Label.Root htmlFor={`active-${row.key}`} className="text-sm text-[var(--app-text)]">
              Active
            </Label.Root>
          </div>
        </div>
          </div>
        </div>
      </div>

      <Dialog.Root open={playOpen} onOpenChange={setPlayOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[300] max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-black p-4 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="truncate pr-8 text-lg font-semibold text-white">
                {row.title?.trim() || "Video preview"}
              </Dialog.Title>
              <Dialog.Close
                className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl bg-black">
              {embed ? (
                <div className="aspect-video w-full">
                  <iframe
                    title={row.title?.trim() || "YouTube preview"}
                    src={embed}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function SortableCourseVideoRow({
  row,
  index,
  inputClass,
  updateVideoRow,
  removeVideoRow,
}: {
  row: VideoRow;
  index: number;
  inputClass: string;
  updateVideoRow: (key: string, patch: Partial<VideoRow>) => void;
  removeVideoRow: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.key,
  });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={sortableStyle}
      className={`list-none ${isDragging ? "rounded-xl shadow-lg ring-2 ring-[var(--app-primary)]/35" : ""}`}
    >
      <CourseFormVideoRowCard
        row={row}
        index={index}
        inputClass={inputClass}
        dragHandle={{ attributes, listeners }}
        onChangeUrl={(v) => updateVideoRow(row.key, { videoUrl: v })}
        onChangeTitle={(v) => updateVideoRow(row.key, { title: v })}
        onChangeDescription={(v) => updateVideoRow(row.key, { description: v })}
        onChangeActive={(v) => updateVideoRow(row.key, { isActive: v })}
        onRemove={() => removeVideoRow(row.key)}
      />
    </li>
  );
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onVideosDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setVideoRows((items) => {
      const oldIndex = items.findIndex((r) => r.key === active.id);
      const newIndex = items.findIndex((r) => r.key === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

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
      .map((row, order) => ({ row, order }))
      .filter(({ row }) => row.videoUrl.trim())
      .map(({ row, order }) => ({
        videoUrl: row.videoUrl.trim(),
        title: row.title.trim() || undefined,
        description: row.description.trim() || undefined,
        isActive: row.isActive !== false,
        order,
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
      body.price = Math.max(0, Number.parseFloat(price) || 0);
    } else {
      body.price = 0;
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
                onValueChange={(v) => {
                  const t = Number(v) as CourseTypeNum;
                  setCourseType(t);
                  if (t === 2) setPrice("0");
                }}
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
                        <Select.ItemText>Paid</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="2"
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-[var(--app-page)]"
                      >
                        <Select.ItemText>Free</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="space-y-2">
              <Label.Root htmlFor={courseType === 1 ? "price" : "course-price-free"} className="text-sm font-medium text-[var(--app-text)]">
                {courseType === 1 ? (
                  <>
                    Price <span className="text-red-500">*</span>
                  </>
                ) : (
                  "Price"
                )}
              </Label.Root>
              {courseType === 2 ? (
                <div
                  id="course-price-free"
                  className="rounded-xl border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--app-border)", background: "var(--app-surface-muted)" }}
                >
                  <p className="font-semibold text-[var(--app-text)]">Free — no payment required</p>
                  <p className="mt-1 text-[var(--app-muted)]">
                    Learners are not charged. This course is saved with price <span className="tabular-nums font-medium text-[var(--app-text)]">$0.00</span>.
                  </p>
                </div>
              ) : (
                <>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                  <p className="text-xs text-[var(--app-muted)]">
                    Amount learners pay (0 is allowed). Use the same currency you display elsewhere.
                  </p>
                </>
              )}
            </div>

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
              <h3 className="text-base font-semibold text-[var(--app-text)]">
                Course videos
                {videoRows.length > 0 ? (
                  <span className="ml-1.5 font-normal text-[var(--app-muted)]">({videoRows.length})</span>
                ) : null}
              </h3>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Drag the handle to reorder. YouTube links show a thumbnail and preview.
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
              No course videos yet. Add YouTube links for previews, or other URLs for playback links only.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onVideosDragEnd}
            >
              <SortableContext items={videoRows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-4">
                  {videoRows.map((row, idx) => (
                    <SortableCourseVideoRow
                      key={row.key}
                      row={row}
                      index={idx}
                      inputClass={inputClass}
                      updateVideoRow={updateVideoRow}
                      removeVideoRow={removeVideoRow}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
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
