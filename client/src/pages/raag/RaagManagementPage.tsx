import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Music, Plus, Search, Trash2, Edit, Eye, Play, RefreshCw } from "lucide-react";
import { fetchCollaboratorRaags, deleteCollaboratorRaag, CollaboratorRaag } from "../../api/collaboratorRaagApi";
import { ROUTES, raagDetailPath, raagEditPath } from "../../routes/paths";

export default function RaagManagementPage() {
  const navigate = useNavigate();
  const [raags, setRaags] = useState<CollaboratorRaag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadRaags = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCollaboratorRaags();
      if (res.success) {
        setRaags(res.raags || []);
      } else {
        setError("Failed to load raags");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRaags();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteCollaboratorRaag(id);
      if (res.success) {
        setRaags((prev) => prev.filter((r) => r._id !== id));
        setDeleteConfirmId(null);
      } else {
        alert(res.message || "Failed to delete raag");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete raag");
    }
  };

  const filteredRaags = raags.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const thaatMatch = r.details?.thaat?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const jaatiMatch = r.details?.jaati?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return nameMatch || thaatMatch || jaatiMatch;
  });

  return (
    <div className="space-y-6">
      {/* Upper Action Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--app-text)] sm:text-3xl">
            Raag Management 🎹
          </h1>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Configure Gurbani raags, musical attributes, and dynamic list of bandishes.
          </p>
        </div>

        <Link
          to={ROUTES.dashboard.raagNew}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 transition"
        >
          <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
          Create New Raag
        </Link>
      </div>

      {/* Grid Stats Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-5 dark:border-indigo-950/40 dark:from-indigo-950/20 dark:to-purple-950/10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Total Raags</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--app-text)]">{raags.length}</p>
        </div>
        <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50/50 to-indigo-50/50 p-5 dark:border-sky-950/40 dark:from-sky-950/20 dark:to-indigo-950/10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">With Audio</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--app-text)]">
            {raags.filter((r) => r.details?.audioUrl).length}
          </p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-5 dark:border-amber-950/40 dark:from-amber-950/20 dark:to-orange-950/10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Total Bandishes</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--app-text)]">
            {raags.reduce((acc, r) => acc + (r.details?.listOfBandish?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-sm">
        <Search className="h-5 w-5 shrink-0 text-[var(--app-muted)]" />
        <input
          type="text"
          placeholder="Search raag name, thaat, or jaati..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-[var(--app-muted)] hover:text-[var(--app-text)]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Table / Grid */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <RefreshCw className="h-8 w-8 animate-spin text-[var(--app-primary)]" />
          <p className="text-sm text-[var(--app-muted)]">Loading Gurbani raags...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200/50 bg-red-50/50 p-6 text-center dark:border-red-950/40 dark:bg-red-950/10">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Error loading raags</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">{error}</p>
          <button
            onClick={loadRaags}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      ) : filteredRaags.length === 0 ? (
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] py-16 text-center">
          <Music className="mx-auto h-12 w-12 text-[var(--app-muted)] opacity-50" strokeWidth={1.5} />
          <h3 className="mt-4 text-base font-bold text-[var(--app-text)]">No Raags Found</h3>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {searchQuery ? "No matches fit your search criteria." : "Create your first Raag to begin!"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border)] bg-[var(--app-page)]/50 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Raag Name</th>
                  <th className="px-6 py-4">Thaat</th>
                  <th className="px-6 py-4">Jaati</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-center">Bandishes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {filteredRaags.map((raag) => {
                  const hasAudio = !!raag.details?.audioUrl;
                  const bandishCount = raag.details?.listOfBandish?.length || 0;

                  return (
                    <tr
                      key={raag._id}
                      className="group transition-colors hover:bg-black/[0.01] dark:hover:bg-white/[0.01]"
                    >
                      <td className="px-6 py-4.5 font-mono text-xs text-[var(--app-muted)]">
                        #{raag.id}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                            <Music className="h-4.5 w-4.5" />
                          </span>
                          <span className="font-semibold text-[var(--app-text)]">
                            {raag.name}
                          </span>
                          {hasAudio && (
                            <span
                              title="Has audio details"
                              className="rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400"
                            >
                              <Play className="h-3 w-3 fill-current" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-[var(--app-text-secondary)]">
                        {raag.details?.thaat || <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-6 py-4.5">
                        {raag.details?.jaati ? (
                          <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/30 dark:text-sky-400">
                            {raag.details.jaati}
                          </span>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-[var(--app-text-secondary)]">
                        {raag.details?.time || <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-6 py-4.5 text-center font-bold text-[var(--app-text)]">
                        {bandishCount > 0 ? (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-50 px-2 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                            {bandishCount}
                          </span>
                        ) : (
                          <span className="text-xs font-normal opacity-40">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(raagDetailPath(raag._id))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => navigate(raagEditPath(raag._id))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--app-border)] text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20 transition"
                            title="Edit raag"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {deleteConfirmId === raag._id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(raag._id)}
                                className="rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white hover:opacity-90"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-lg border border-[var(--app-border)] px-2 py-1 text-xs text-[var(--app-muted)] hover:bg-black/5"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(raag._id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--app-border)] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition"
                              title="Delete raag"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
