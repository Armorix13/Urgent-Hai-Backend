import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Label from "@radix-ui/react-label";
import * as Separator from "@radix-ui/react-separator";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createSuggestion,
  deleteSuggestion,
  fetchSuggestions,
  updateSuggestion,
  type SuggestionAnalytics,
  type SuggestionPagination,
  type SuggestionRow,
} from "@/api/suggestionApi";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { readLearnerUserIdFromAccessToken } from "@/lib/jwtPayload";
import { brand } from "@/config/navigation";
import { ROUTES } from "@/routes/paths";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  try {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark
              key={i}
              className="rounded bg-teal-200/90 px-0.5 font-inherit text-inherit dark:bg-teal-900/60"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

function SuggestionCard({
  row,
  canModify,
  onUpdated,
  onDeleted,
  highlightQuery,
}: {
  row: SuggestionRow;
  canModify: boolean;
  onUpdated: () => void;
  onDeleted: () => void;
  highlightQuery: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(row.title);
  const [description, setDescription] = useState(row.description);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setTitle(row.title);
    setDescription(row.description);
  }, [row._id, row.title, row.description]);

  const author =
    row.user?.userName?.trim() ||
    row.user?.email?.trim() ||
    "Learner";
  const avatar = row.user?.profileImage;

  async function handleSave() {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      setErr("Title and description are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await updateSuggestion(row._id, { title: t, description: d });
      setEditing(false);
      onUpdated();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setErr(null);
    try {
      await deleteSuggestion(row._id);
      onDeleted();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border bg-[var(--app-surface)] shadow-sm transition hover:shadow-md"
      style={{ borderColor: "var(--app-border)" }}
    >
      <div className="flex gap-4 p-5 sm:p-6">
        <div className="hidden shrink-0 sm:block">
          <div
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-400/30 to-cyan-500/20 text-sm font-bold text-teal-800 dark:text-teal-100"
            style={{ border: "1px solid var(--app-border)" }}
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              author.slice(0, 1).toUpperCase()
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--app-muted)]">
                <span className="text-[var(--app-text)]">{author}</span>
                <span className="mx-1.5 text-[var(--app-border)]">·</span>
                <time dateTime={row.createdAt}>{formatRelativeTime(row.createdAt)}</time>
              </p>
              {editing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2 text-base font-semibold text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
                  style={{ borderColor: "var(--app-border)" }}
                  maxLength={200}
                  aria-label="Title"
                />
              ) : (
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--app-text)]">
                  <HighlightText text={row.title} query={highlightQuery} />
                </h3>
              )}
            </div>
            {canModify && !editing ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--app-bg)]"
                  style={{ borderColor: "var(--app-border)", color: "var(--app-primary)" }}
                >
                  Edit
                </button>
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <button
                      type="button"
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
                    >
                      Delete
                    </button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]" />
                    <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[101] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-2xl focus:outline-none">
                      <AlertDialog.Title className="text-lg font-semibold text-[var(--app-text)]">
                        Delete this suggestion?
                      </AlertDialog.Title>
                      <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                        This cannot be undone. Your feedback will be removed from the board.
                      </AlertDialog.Description>
                      <div className="mt-6 flex justify-end gap-2">
                        <AlertDialog.Cancel asChild>
                          <button
                            type="button"
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--app-muted)] hover:bg-[var(--app-bg)]"
                          >
                            Cancel
                          </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {deleting ? "Deleting…" : "Delete"}
                          </button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </div>
            ) : null}
            {canModify && editing ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setTitle(row.title);
                    setDescription(row.description);
                    setErr(null);
                  }}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)] hover:bg-[var(--app-bg)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                  style={{ background: "var(--app-primary)" }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            ) : null}
          </div>
          {editing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-3 w-full resize-y rounded-xl border bg-[var(--app-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
              style={{ borderColor: "var(--app-border)" }}
              maxLength={2000}
              aria-label="Description"
            />
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--app-muted)]">
              <HighlightText text={row.description} query={highlightQuery} />
            </p>
          )}
          {err ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {err}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SubmitSuggestionPanel({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      setErr("Please add a title and description.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    setOk(false);
    try {
      await createSuggestion({ title: t, description: d });
      setTitle("");
      setDescription("");
      setOk(true);
      onCreated();
    } catch (e) {
      setErr(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not submit",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rounded-2xl border bg-[var(--app-surface)] p-5 shadow-sm sm:p-6"
      style={{ borderColor: "var(--app-border)" }}
    >
      <h3 className="text-base font-semibold text-[var(--app-text)]">Share a suggestion</h3>
      <p className="mt-1 text-sm text-[var(--app-muted)]">
        Ideas for features, content, or improvements — visible to the whole community.
      </p>
      <Separator.Root className="my-4 h-px bg-[var(--app-border)]" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label.Root htmlFor="suggestion-title" className="text-sm font-medium text-[var(--app-text)]">
            Title
          </Label.Root>
          <input
            id="suggestion-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary"
            maxLength={200}
            className="w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            style={{ borderColor: "var(--app-border)" }}
          />
        </div>
        <div className="space-y-2">
          <Label.Root
            htmlFor="suggestion-description"
            className="text-sm font-medium text-[var(--app-text)]"
          >
            Details
          </Label.Root>
          <textarea
            id="suggestion-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`What would make ${brand.name} better for you?`}
            rows={5}
            maxLength={2000}
            className="w-full resize-y rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm leading-relaxed text-[var(--app-text)] placeholder:text-[var(--app-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            style={{ borderColor: "var(--app-border)" }}
          />
        </div>
        {err ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {err}
          </p>
        ) : null}
        {ok ? (
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
            Thanks — your suggestion was posted.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60 sm:w-auto sm:px-8"
          style={{
            background: "linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #0284c7 100%)",
          }}
        >
          {submitting ? "Submitting…" : "Submit suggestion"}
        </button>
      </form>
    </div>
  );
}

function AnalyticsStrip({
  data,
  loading,
}: {
  data: SuggestionAnalytics | null;
  loading: boolean;
}) {
  const items = useMemo(
    () => [
      {
        label: "All suggestions",
        value: data?.totalSuggestions ?? 0,
        hint: "Total on the board",
      },
      {
        label: "Last 7 days",
        value: data?.submittedLast7Days ?? 0,
        hint: "New submissions",
      },
      {
        label: "Last 30 days",
        value: data?.submittedLast30Days ?? 0,
        hint: "Recent activity",
      },
      {
        label: "Contributors",
        value: data?.uniqueContributors ?? 0,
        hint: "Unique learners",
      },
    ],
    [data],
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border bg-[var(--app-surface)] p-4 shadow-sm transition ${loading ? "opacity-70" : ""}`}
          style={{ borderColor: "var(--app-border)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[var(--app-text)]">
            {loading && data === null ? "—" : item.value.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-[var(--app-muted)]">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

function PaginationBar({
  meta,
  onPageChange,
}: {
  meta: SuggestionPagination;
  onPageChange: (p: number) => void;
}) {
  const { currentPage, totalPages, hasPrevPage, hasNextPage, totalItems, pageSize } = meta;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = paginationRange(currentPage, totalPages);

  return (
    <div
      className="flex flex-col gap-4 border-t pt-6"
      style={{ borderColor: "var(--app-border)" }}
    >
      <p className="text-center text-sm text-[var(--app-muted)] sm:text-left">
        <span className="tabular-nums">
          {totalItems === 0 ? "No results" : `Showing ${start}–${end}`}
        </span>
        {totalItems > 0 ? (
          <>
            <span className="mx-1.5 text-[var(--app-border)]">·</span>
            <span className="tabular-nums">{totalItems.toLocaleString()} total</span>
          </>
        ) : null}
      </p>
      {totalPages > 1 ? (
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
            <button
              type="button"
              disabled={!hasPrevPage}
              onClick={() => onPageChange(1)}
              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition enabled:hover:bg-[var(--app-bg)] disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
            >
              First
            </button>
            <button
              type="button"
              disabled={!hasPrevPage}
              onClick={() => onPageChange(currentPage - 1)}
              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition enabled:hover:bg-[var(--app-bg)] disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
            >
              Prev
            </button>
            {pages.map((p, idx) =>
              p === "…" ? (
                <span
                  key={`e-${idx}`}
                  className="px-1 text-xs text-[var(--app-muted)]"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-9 rounded-lg border px-2 py-1.5 text-xs font-semibold tabular-nums transition ${
                    p === currentPage
                      ? "border-teal-600 bg-teal-600 text-white shadow-sm dark:border-teal-500 dark:bg-teal-600"
                      : "enabled:hover:bg-[var(--app-bg)]"
                  }`}
                  style={
                    p === currentPage
                      ? undefined
                      : { borderColor: "var(--app-border)", color: "var(--app-text)" }
                  }
                  aria-current={p === currentPage ? "page" : undefined}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => onPageChange(currentPage + 1)}
              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition enabled:hover:bg-[var(--app-bg)] disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
            >
              Next
            </button>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => onPageChange(totalPages)}
              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition enabled:hover:bg-[var(--app-bg)] disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
            >
              Last
            </button>
          </div>
          <p className="text-center text-xs text-[var(--app-muted)] sm:text-right">
            Page <span className="tabular-nums font-semibold text-[var(--app-text)]">{currentPage}</span> of{" "}
            <span className="tabular-nums font-semibold text-[var(--app-text)]">{totalPages}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function SuggestionPage() {
  const { user } = useAuth();
  const token = user?.accessToken;
  const isCollaborator = user?.accountType === "collaborator";
  const learnerUserId = readLearnerUserIdFromAccessToken(token);
  const canSubmit = Boolean(token && !isCollaborator && learnerUserId);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounced(searchInput, 380);
  const [listNonce, setListNonce] = useState(0);
  const [rows, setRows] = useState<SuggestionRow[]>([]);
  const [pagination, setPagination] = useState<SuggestionPagination | null>(null);
  const [analytics, setAnalytics] = useState<SuggestionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRows([]);
      setPagination(null);
      setAnalytics(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSuggestions({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
      });
      setRows(res.suggestions ?? []);
      setPagination(res.pagination ?? null);
      if (res.analytics) setAnalytics(res.analytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load suggestions");
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, debouncedSearch, listNonce]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!token) {
    return (
      <div
        className="rounded-2xl border px-6 py-12 text-center"
        style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
      >
        <p className="text-[var(--app-muted)]">Sign in to view and share suggestions.</p>
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

  return (
    <div className="space-y-8 pb-12">
      <section
        className="relative overflow-hidden rounded-[1.75rem] px-6 py-8 text-white shadow-lg sm:px-10 sm:py-10"
        style={{
          background: "linear-gradient(135deg, #0f766e 0%, #0e7490 45%, #0369a1 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl"
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Suggestions</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          Shape the future of {brand.name}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-teal-50/95">
          Browse ideas from learners and teachers. Search the board, scan live stats, and page through
          results — learner accounts can post, edit, or remove their own suggestions.
        </p>
      </section>

      <AnalyticsStrip data={analytics} loading={loading && analytics === null} />

      <div
        className="flex flex-col gap-4 rounded-2xl border bg-[var(--app-surface)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
        style={{ borderColor: "var(--app-border)" }}
      >
        <div className="relative min-w-0 flex-1 sm:max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" aria-hidden>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search titles and descriptions…"
            autoComplete="off"
            className="w-full rounded-xl border bg-[var(--app-bg)] py-2.5 pl-10 pr-10 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            style={{ borderColor: "var(--app-border)" }}
            aria-label="Search suggestions"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--app-muted)] hover:bg-[var(--app-bg)] hover:text-[var(--app-text)]"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          <label htmlFor="suggestion-page-size" className="text-xs font-medium text-[var(--app-muted)]">
            Per page
          </label>
          <select
            id="suggestion-page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-xl border bg-[var(--app-bg)] px-3 py-2 text-sm font-semibold text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            style={{ borderColor: "var(--app-border)" }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!loading && !error && pagination ? (
        <p className="text-sm text-[var(--app-muted)]">
          {debouncedSearch.trim() ? (
            <>
              <span className="font-semibold text-[var(--app-text)] tabular-nums">
                {pagination.totalItems.toLocaleString()}
              </span>{" "}
              {pagination.totalItems === 1 ? "match" : "matches"} for &ldquo;
              <span className="text-[var(--app-text)]">{debouncedSearch.trim()}</span>&rdquo;
            </>
          ) : (
            <>
              <span className="font-semibold text-[var(--app-text)] tabular-nums">
                {pagination.totalItems.toLocaleString()}
              </span>{" "}
              {pagination.totalItems === 1 ? "suggestion" : "suggestions"} in the board
              {pagination.totalPages > 1 ? " — flip through pages below." : ""}
            </>
          )}
        </p>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-[var(--app-border)]/40" />
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
                {debouncedSearch.trim() ? (
                  <>
                    No suggestions match &ldquo;{debouncedSearch.trim()}&rdquo;. Try a shorter phrase or
                    different keywords.
                  </>
                ) : (
                  <>
                    No suggestions yet. Be the first to share an idea{canSubmit ? "." : " (learner login)."}
                  </>
                )}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            rows.map((row) => (
              <SuggestionCard
                key={row._id}
                row={row}
                canModify={Boolean(learnerUserId && row.userId === learnerUserId)}
                onUpdated={load}
                onDeleted={load}
                highlightQuery={debouncedSearch}
              />
            ))}

          {!loading && !error && pagination ? (
            <PaginationBar meta={pagination} onPageChange={setPage} />
          ) : null}
        </div>

        <aside className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-6">
          {canSubmit ? (
            <SubmitSuggestionPanel
              onCreated={() => {
                setPage(1);
                setListNonce((n) => n + 1);
              }}
            />
          ) : (
            <div
              className="rounded-2xl border bg-[var(--app-surface)] p-5 shadow-sm sm:p-6"
              style={{ borderColor: "var(--app-border)" }}
            >
              <h3 className="text-base font-semibold text-[var(--app-text)]">Learner submissions</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
                {isCollaborator
                  ? "You’re signed in as a collaborator. Suggestions can only be created from a learner account; you can still review all posts on the left."
                  : "Sign in with a learner account to post your own suggestions."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
