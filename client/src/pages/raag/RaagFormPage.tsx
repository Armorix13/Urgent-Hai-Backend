import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Disc, FileText, Play, Pause, Volume2, VolumeX, X, ExternalLink, Video } from "lucide-react";
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

  // Audio Playbar State
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [activeAudioName, setActiveAudioName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Media Modal Preview State
  const [modalMedia, setModalMedia] = useState<{
    type: "pdf" | "video" | "audio";
    url: string;
    name: string;
  } | null>(null);

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

  // Audio Controls
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeAudioUrl]);

  const handlePlayAudio = (url: string, name: string) => {
    if (activeAudioUrl === url) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveAudioUrl(url);
      setActiveAudioName(name);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      audioRef.current.currentTime = percentage * duration;
      setCurrentTime(percentage * duration);
    }
  };

  const closeAudioPlayer = () => {
    setIsPlaying(false);
    setActiveAudioUrl(null);
    setActiveAudioName(null);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

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
      alert("Raag Name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

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
        setError(res.message || "Failed to save raag configurations.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewMedia = (type: "pdf" | "video" | "audio", url: string, name: string) => {
    setModalMedia({ type, url, name });
  };

  if (fetching) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)]">
        <Disc className="h-8 w-8 animate-spin text-[var(--app-primary)]" />
        <p className="text-sm text-[var(--app-muted)]">Fetching Raag configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header back bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.dashboard.raag)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--app-text)] sm:text-2xl">
              {isView ? "Raag Details 🎹" : isEdit ? "Modify Raag ⚙️" : "Configure New Raag 🎼"}
            </h1>
            <p className="mt-0.5 text-xs text-[var(--app-muted)]">
              {isView ? "Read-only summary of attributes." : "Set custom parameters, time zones, and lists."}
            </p>
          </div>
        </div>

        {audioUrl && (
          <button
            type="button"
            onClick={() => handlePlayAudio(audioUrl, `${name} (Guide)`)}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition ${activeAudioUrl === audioUrl && isPlaying
              ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-rose-500/20"
              : "bg-indigo-600 text-white shadow-indigo-500/20 hover:opacity-90"
              }`}
          >
            {activeAudioUrl === audioUrl && isPlaying ? (
              <>
                <Pause className="h-4.5 w-4.5 fill-current" /> Pause Guide Audio
              </>
            ) : (
              <>
                <Play className="h-4.5 w-4.5 fill-current ml-0.5" /> Listen to Audio Guide
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Main Config Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identity */}
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--app-text)]">1. General Identity</h2>
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
              Raag Name (in Punjabi / Gurbani format)
            </label>
            <input
              type="text"
              required
              disabled={isView}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ਰਾਗ ਮਾਝ"
              className="w-full rounded-xl border border-[var(--app-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--app-text)] outline-none focus:border-[var(--app-primary)] transition"
            />
          </div>
        </div>

        {/* Musicology Fields Grid */}
        <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-[var(--app-text)]">2. Musical Theory & Attributes</h2>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
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
                  Samay / Time (ਸਮਾਂ)
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

            <div className="grid gap-4 sm:grid-cols-4">
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
                  Samvadi (ਸੰਵਾਦੀ)
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

              <div className="sm:col-span-2">
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

            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1.5">
                Sur scale (ਸੁਰ)
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
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Bandish #{item.sId}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--app-text)] truncate">{item.bandishName}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.pdfUrl ? (
                        <button
                          type="button"
                          onClick={() => handlePreviewMedia("pdf", item.pdfUrl!, `${item.bandishName} Sheet Music`)}
                          className="flex items-center gap-1 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1 text-[10px] text-sky-700 font-bold dark:border-sky-950/40 dark:bg-sky-950/20 dark:text-sky-400 hover:opacity-90 transition"
                        >
                          <FileText className="h-3 w-3" /> View PDF Modal
                        </button>
                      ) : (
                        <span className="text-[10px] text-[var(--app-muted)] py-1">No PDF</span>
                      )}

                      {item.audioUrl && (
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(item.audioUrl!, `${item.bandishName} Audio`)}
                          className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${activeAudioUrl === item.audioUrl && isPlaying
                            ? "bg-red-500 border-red-500 text-white animate-pulse"
                            : "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-950/40 dark:bg-emerald-950/20 dark:text-emerald-400 hover:opacity-90"
                            }`}
                        >
                          {activeAudioUrl === item.audioUrl && isPlaying ? (
                            <>
                              <Pause className="h-3 w-3 fill-current" /> Pause Audio
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 fill-current ml-0.5" /> Listen Audio
                            </>
                          )}
                        </button>
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

      {/* Floating Premium Audio Player Widget */}
      {activeAudioUrl && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-xl -translate-x-1/2 rounded-3xl border border-indigo-500/20 bg-white/90 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-indigo-400/10 dark:bg-zinc-950/90">
          <audio
            ref={audioRef}
            src={activeAudioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            muted={isMuted}
          />
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Disc className="h-3 w-3 animate-spin" /> Playing Gurbani Guide
              </p>
              <p className="mt-0.5 truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{activeAudioName}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/20 transition"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={toggleMute}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${isMuted ? "bg-red-500/10 border-red-500/30" : ""}`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-4.5 w-4.5 text-red-500" /> : <Volume2 className="h-4.5 w-4.5" />}
              </button>

              <button
                onClick={closeAudioPlayer}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Close Player"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <div
              onClick={handleProgressClick}
              className="relative h-1.5 w-full cursor-pointer rounded-full bg-zinc-200 dark:bg-zinc-800"
            >
              <div
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Unified Media Preview Overlay Modal */}
      {modalMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 px-6 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  {modalMedia.type === "pdf" ? <FileText className="h-3 w-3" /> : <Video className="h-3 w-3" />} Gurbani Document Hub
                </span>
                <h3 className="mt-0.5 text-base font-extrabold text-zinc-950 dark:text-zinc-50">{modalMedia.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={modalMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Direct
                </a>
                <button
                  onClick={() => setModalMedia(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/30 p-4">
              {modalMedia.type === "pdf" ? (
                <iframe
                  src={modalMedia.url}
                  className="h-full w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white shadow-sm"
                  title="PDF Preview"
                />
              ) : modalMedia.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
                  <iframe
                    src={
                      modalMedia.url.includes("youtube.com") || modalMedia.url.includes("drive.google.com")
                        ? modalMedia.url.replace("view?usp=sharing", "preview")
                        : modalMedia.url
                    }
                    className="h-full w-full border-0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title="Video Preview"
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <Disc className="h-16 w-16 animate-spin text-indigo-500" strokeWidth={1.5} />
                  <p className="text-sm text-zinc-400">Audio is playing in the bottom playbar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
