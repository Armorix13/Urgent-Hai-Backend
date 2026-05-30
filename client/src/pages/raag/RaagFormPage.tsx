import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Disc, FileText } from "lucide-react";
import { fetchCollaboratorRaagById, createCollaboratorRaag, updateCollaboratorRaag, CollaboratorBandish } from "../../api/collaboratorRaagApi";
import { ROUTES } from "../../routes/paths";

type Props = {
  readOnly?: boolean;
};

export default function RaagFormPage({ readOnly = false }: Props) {
  const navigate = useNavigate();
  const { raagId } = useParams<{ raagId: string }>();
  const isEdit = !!raagId && !readOnly;
  const isView = !!raagId && readOnly;

  // Form Fields State
  const [name, setName] = useState("");
  const [sur, setSur] = useState("");
  const [thaat, setThaat] = useState("");
  const [wargitSur, setWargitSur] = useState("");
  const [jaati, setJaati] = useState("");
  const [time, setTime] = useState("");
  const [vaadi, setVaadi] = useState("");
  const [samvadi, setSamvadi] = useState("");
  const [aroh, setAroh] = useState("");
  const [avroh, setAvroh] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [listOfBandish, setListOfBandish] = useState<CollaboratorBandish[]>([]);

  // Local Bandish Builder Form State
  const [newBandishName, setNewBandishName] = useState("");
  const [newBandishPdfUrl, setNewBandishPdfUrl] = useState("");
  const [newBandishAudioUrl, setNewBandishAudioUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (raagId) {
      const loadRaag = async () => {
        try {
          setFetching(true);
          setError(null);
          const res = await fetchCollaboratorRaagById(raagId);
          if (res.success && res.raag) {
            const r = res.raag;
            setName(r.name);
            if (r.details) {
              const d = r.details;
              setSur(d.sur || "");
              setThaat(d.thaat || "");
              setWargitSur(d.wargitSur || "");
              setJaati(d.jaati || "");
              setTime(d.time || "");
              setVaadi(d.vaadi || "");
              setSamvadi(d.samvadi || "");
              setAroh(d.aroh || "");
              setAvroh(d.avroh || "");
              setAudioUrl(d.audioUrl || "");
              setListOfBandish(d.listOfBandish || []);
            }
          } else {
            setError("Could not load raag details");
          }
        } catch (err: any) {
          setError(err?.message || "Failed to load raag");
        } finally {
          setFetching(false);
        }
      };
      loadRaag();
    }
  }, [raagId]);

  const handleAddBandish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBandishName.trim()) {
      alert("Bandish name is required");
      return;
    }

    const nextSId = listOfBandish.reduce((max, item) => (item.sId > max ? item.sId : max), 0) + 1;

    const newItem: CollaboratorBandish = {
      sId: nextSId,
      bandishName: newBandishName.trim(),
      pdfUrl: newBandishPdfUrl.trim() || null,
      audioUrl: newBandishAudioUrl.trim() || null,
    };

    setListOfBandish((prev) => [...prev, newItem]);
    setNewBandishName("");
    setNewBandishPdfUrl("");
    setNewBandishAudioUrl("");
  };

  const handleRemoveBandish = (sId: number) => {
    setListOfBandish((prev) => prev.filter((item) => item.sId !== sId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Raag name is required");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        sur: sur.trim() || null,
        thaat: thaat.trim() || null,
        wargitSur: wargitSur.trim() || null,
        jaati: jaati.trim() || null,
        time: time.trim() || null,
        vaadi: vaadi.trim() || null,
        samvadi: samvadi.trim() || null,
        aroh: aroh.trim() || null,
        avroh: avroh.trim() || null,
        audioUrl: audioUrl.trim() || null,
        listOfBandish,
      };

      let res;
      if (isEdit && raagId) {
        res = await updateCollaboratorRaag(raagId, payload);
      } else {
        res = await createCollaboratorRaag(payload);
      }

      if (res.success) {
        navigate(ROUTES.dashboard.raag);
      } else {
        alert(res.message || "Operation failed");
      }
    } catch (err: any) {
      alert(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Disc className="h-8 w-8 animate-spin text-[var(--app-primary)]" />
        <p className="text-sm text-[var(--app-muted)]">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(ROUTES.dashboard.raag)}
          className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </button>

        <h1 className="hidden text-xl font-bold text-[var(--app-text)] sm:block">
          {isView ? "Raag Details 🎼" : isEdit ? "Edit Raag 🎹" : "Add Raag 🎵"}
        </h1>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200/50 bg-red-50/50 p-4 text-sm font-semibold text-red-600 dark:border-red-950/40 dark:bg-red-950/10">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Attributes Panel */}
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--app-text)]">1. General Attributes</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Raag Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isView}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ਰਾਗ ਮਾਝ"
                className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Thaat (ਥਾਟ)
              </label>
              <input
                type="text"
                disabled={isView}
                value={thaat}
                onChange={(e) => setThaat(e.target.value)}
                placeholder="e.g. ਖਮਾਜ"
                className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Jaati (ਜਾਤੀ)
              </label>
              <input
                type="text"
                disabled={isView}
                value={jaati}
                onChange={(e) => setJaati(e.target.value)}
                placeholder="e.g. ਸੰਪੂਰਣ-ਸੰਪੂਰਣ"
                className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Time (ਸਮਾਂ)
              </label>
              <input
                type="text"
                disabled={isView}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. ਦੁਪਹਿਰ"
                className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
              />
            </div>
          </div>
        </div>

        {/* Musical Details Panel */}
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--app-text)]">2. Musical Theory</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Vaadi (ਵਾਦੀ)
              </label>
              <input
                type="text"
                disabled={isView}
                value={vaadi}
                onChange={(e) => setVaadi(e.target.value)}
                placeholder="e.g. ਪਾ"
                className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Samvadi (ਸਮਵਾਦੀ)
              </label>
              <input
                type="text"
                disabled={isView}
                value={samvadi}
                onChange={(e) => setSamvadi(e.target.value)}
                placeholder="e.g. ਰੇ"
                className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Wargit Sur (ਵਰਜਿਤ ਸੁਰ)
              </label>
              <input
                type="text"
                disabled={isView}
                value={wargitSur}
                onChange={(e) => setWargitSur(e.target.value)}
                placeholder="e.g. ਕੋਮਲ ਨੀ"
                className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Surs (ਸੁਰ)
              </label>
              <input
                type="text"
                disabled={isView}
                value={sur}
                onChange={(e) => setSur(e.target.value)}
                placeholder="ਸਾ ਰੇ ਗਾ ਮਾ ਪਾ ਧਾ ਨੀ ਸਾ"
                className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                  Aroh (ਆਰੋਹ)
                </label>
                <input
                  type="text"
                  disabled={isView}
                  value={aroh}
                  onChange={(e) => setAroh(e.target.value)}
                  placeholder="ਸਾ ਰੇ ਗਾ ਮਾ ਪਾ ਧਾ ਨੀ ਸਾ"
                  className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                  Avroh (ਅਵਰੋਹ)
                </label>
                <input
                  type="text"
                  disabled={isView}
                  value={avroh}
                  onChange={(e) => setAvroh(e.target.value)}
                  placeholder="ਸਾ ਨੀ ਧਾ ਪਾ ਮਾ ਗਾ ਰੇ ਸਾ"
                  className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Media Attachments */}
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--app-text)]">3. Audio Guide URL</h2>
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
              Audio URL
            </label>
            <input
              type="text"
              disabled={isView}
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
            />
          </div>
        </div>

        {/* List of Bandishes Section */}
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-[var(--app-text)]">4. List of Bandishes ({listOfBandish.length})</h2>

          {/* Builder Form (Only when NOT read-only) */}
          {!isView && (
            <div className="rounded-2xl border border-dashed border-[var(--app-border)] p-4 bg-[var(--app-page)]/30 space-y-4">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Add Bandish Subdocument</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--app-text-secondary)] mb-1.5">
                    Bandish Name
                  </label>
                  <input
                    type="text"
                    value={newBandishName}
                    onChange={(e) => setNewBandishName(e.target.value)}
                    placeholder="e.g. ਮਾਝ ਰਾਗ ਬੰਦਿਸ਼ 1"
                    className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2 text-xs text-[var(--app-text)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--app-text-secondary)] mb-1.5">
                    PDF URL
                  </label>
                  <input
                    type="text"
                    value={newBandishPdfUrl}
                    onChange={(e) => setNewBandishPdfUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2 text-xs text-[var(--app-text)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--app-text-secondary)] mb-1.5">
                    Audio URL
                  </label>
                  <input
                    type="text"
                    value={newBandishAudioUrl}
                    onChange={(e) => setNewBandishAudioUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-2 text-xs text-[var(--app-text)] outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddBandish}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Append Bandish
              </button>
            </div>
          )}

          {/* List of Active Items */}
          {listOfBandish.length === 0 ? (
            <p className="text-center py-6 text-xs text-[var(--app-muted)]">No bandishes registered.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {listOfBandish.map((item) => (
                <div
                  key={item.sId}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-page)]/10 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Bandish #{item.sId}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--app-text)] truncate">{item.bandishName}</p>
                    <div className="mt-2 flex gap-2">
                      {item.pdfUrl ? (
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-semibold"
                        >
                          <FileText className="h-3 w-3" /> PDF URL
                        </a>
                      ) : (
                        <span className="text-[10px] text-[var(--app-muted)]">No PDF</span>
                      )}
                      {item.audioUrl && (
                        <a
                          href={item.audioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold"
                        >
                          <Disc className="h-3 w-3" /> Audio URL
                        </a>
                      )}
                    </div>
                  </div>
                  {!isView && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBandish(item.sId)}
                      className="rounded-lg p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions (Only when NOT read-only) */}
        {!isView && (
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? (
              <Disc className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Save className="h-4.5 w-4.5" />
            )}
            {isEdit ? "Save Raag Changes" : "Create New Raag"}
          </button>
        )}
      </form>
    </div>
  );
}
