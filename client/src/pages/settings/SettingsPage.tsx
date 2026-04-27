import * as Label from "@radix-ui/react-label";
import * as Separator from "@radix-ui/react-separator";
import { CheckCircle2, KeyRound, Loader2, Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  fetchCollaboratorMe,
  patchCollaboratorMe,
  type CollaboratorMe,
} from "@/api/collaboratorMeApi";
import { useAuth } from "@/context/AuthContext";
import { ApiError, uploadImageFile } from "@/lib/api";
import { publicUploadUrl } from "@/lib/env";
import { ROUTES } from "@/routes/paths";

type TabId = "profile" | "security";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label.Root htmlFor={id} className="text-sm font-medium text-[var(--app-text)]">
        {label}
      </Label.Root>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-[var(--app-muted)]">{hint}</p> : null}
    </div>
  );
}

export default function SettingsPage() {
  const { user, patchUser } = useAuth();
  const token = user?.accessToken;
  const isCollaborator = user?.accountType === "collaborator";

  const [tab, setTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CollaboratorMe | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profession, setProfession] = useState("");
  const [bio, setBio] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const coverFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  /** Shown after a successful `/file-upload` (API `message`). */
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const hydrate = useCallback((c: CollaboratorMe) => {
    setProfile(c);
    setName(c.name ?? "");
    setEmail(c.email ?? "");
    setPhoneNumber(c.phoneNumber ?? "");
    setAddress(c.address ?? "");
    setProfession(c.profession ?? c.professionValue ?? "");
    setBio(c.bio ?? "");
    setProfileUrl(c.profile ?? "");
    setCoverUrl(c.coverProfile ?? "");
  }, []);

  const load = useCallback(async () => {
    if (!token || !isCollaborator) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchCollaboratorMe();
      hydrate(res.collaborator);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load settings");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [token, isCollaborator, hydrate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!uploadNotice) return;
    const id = window.setTimeout(() => setUploadNotice(null), 5000);
    return () => window.clearTimeout(id);
  }, [uploadNotice]);

  async function handleCoverFile(file: File | null | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setProfileErr(null);
    setProfileMsg(null);
    setCoverUploading(true);
    try {
      const res = await uploadImageFile(file);
      setCoverUrl(res.url);
      setUploadNotice(res.message);
    } catch (err) {
      setUploadNotice(null);
      setProfileErr(err instanceof ApiError ? err.message : "Could not upload cover image");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleAvatarFile(file: File | null | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setProfileErr(null);
    setProfileMsg(null);
    setAvatarUploading(true);
    try {
      const res = await uploadImageFile(file);
      setProfileUrl(res.url);
      setUploadNotice(res.message);
    } catch (err) {
      setUploadNotice(null);
      setProfileErr(err instanceof ApiError ? err.message : "Could not upload profile photo");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileErr(null);
    setProfileMsg(null);
    try {
      const res = await patchCollaboratorMe({
        name: name.trim() || null,
        email: email.trim() ? email.trim().toLowerCase() : null,
        phoneNumber: phoneNumber.trim() || null,
        address: address.trim() || null,
        profession: profession.trim() || null,
        bio: bio.trim() || null,
        profile: profileUrl.trim() || null,
        coverProfile: coverUrl.trim() || null,
      });
      hydrate(res.collaborator);
      const dn =
        res.collaborator.name?.trim() ||
        res.collaborator.email?.split("@")[0] ||
        res.collaborator.phoneNumber ||
        "Collaborator";
      patchUser({
        displayName: dn,
        email: res.collaborator.email ?? user?.email ?? "",
      });
      setProfileMsg("Changes saved.");
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    const hasPw = profile?.hasPassword === true;
    if (newPassword.length < 8) {
      setPwErr("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr("New passwords do not match.");
      return;
    }
    if (hasPw && !currentPassword.trim()) {
      setPwErr("Enter your current password.");
      return;
    }
    setPwSaving(true);
    try {
      const res = await patchCollaboratorMe({
        ...(hasPw ? { currentPassword } : {}),
        newPassword,
      });
      hydrate(res.collaborator);
      if (res.access_token) {
        patchUser({ accessToken: res.access_token });
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg(
        res.message ??
          (hasPw ? "Password updated. You can keep working — your session was refreshed." : "Password created."),
      );
    } catch (err) {
      setPwErr(err instanceof ApiError ? err.message : "Could not update password");
    } finally {
      setPwSaving(false);
    }
  }

  if (!token) {
    return (
      <div
        className="rounded-2xl border px-6 py-12 text-center"
        style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
      >
        <p className="text-[var(--app-muted)]">Sign in to manage your account.</p>
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

  if (!isCollaborator) {
    return (
      <div
        className="mx-auto max-w-lg rounded-2xl border bg-[var(--app-surface)] p-8 text-center shadow-sm"
        style={{ borderColor: "var(--app-border)" }}
      >
        <h2 className="text-lg font-semibold text-[var(--app-text)]">Settings</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">
          Account preferences for learner profiles are not available in this web app yet. Use the mobile
          app or contact support if you need to update your learner account.
        </p>
      </div>
    );
  }

  const displayInitial =
    (name.trim() || email.trim() || phoneNumber.trim() || "?").slice(0, 1).toUpperCase();

  const tabs: { id: TabId; label: string; description: string }[] = [
    { id: "profile", label: "Profile", description: "Name, contact, and public details" },
    { id: "security", label: "Security", description: "Password and sign-in" },
  ];

  return (
    <div className="pb-12">
      <section
        className="relative mb-8 overflow-hidden rounded-[1.75rem] px-6 py-8 text-white shadow-lg sm:px-10 sm:py-9"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 40%, #312e81 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">Settings</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Manage your Raag Vidyalaya profile</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100/95">
          Update how you appear to learners — similar to a Google Account profile: photo, cover, contact
          info, and password in one place.
        </p>
      </section>

      {loading && (
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-2xl bg-[var(--app-border)]/50" />
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--app-border)]/40" />
        </div>
      )}

      {!loading && loadError && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {!loading && !loadError && profile && (
        <div className="lg:flex lg:items-start lg:gap-10">
          <nav
            className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:mb-0 lg:w-52 lg:flex-shrink-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
            aria-label="Settings sections"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setProfileMsg(null);
                  setProfileErr(null);
                  setPwMsg(null);
                  setPwErr(null);
                }}
                className={`flex w-full flex-col rounded-2xl border px-4 py-3 text-left transition ${
                  tab === t.id
                    ? "border-[var(--app-primary)] bg-[var(--app-primary)]/10 shadow-sm"
                    : "border-transparent bg-[var(--app-surface)] hover:bg-[var(--app-bg)]"
                }`}
                style={
                  tab === t.id
                    ? undefined
                    : { borderColor: "var(--app-border)" }
                }
              >
                <span className="text-sm font-semibold text-[var(--app-text)]">{t.label}</span>
                <span className="mt-0.5 text-xs text-[var(--app-muted)]">{t.description}</span>
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 space-y-6">
            {tab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div
                  className="overflow-hidden rounded-[1.5rem] border bg-[var(--app-surface)] shadow-sm"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <input
                    ref={coverFileRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(e) => {
                      void handleCoverFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(e) => {
                      void handleAvatarFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />

                  <div className="relative h-40 sm:h-48">
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-slate-200 via-blue-100 to-indigo-200 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950"
                      aria-hidden
                    />
                    {publicUploadUrl(coverUrl) ? (
                      <img
                        src={publicUploadUrl(coverUrl)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                    {coverUploading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
                        <Loader2 className="h-9 w-9 animate-spin text-white" aria-hidden />
                        <span className="sr-only">Uploading cover…</span>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => coverFileRef.current?.click()}
                      disabled={coverUploading}
                      className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="Change cover image"
                      title="Change cover"
                    >
                      <Pencil className="h-5 w-5" strokeWidth={2.25} />
                    </button>
                  </div>

                  <div className="relative px-5 pb-6 pt-0 sm:px-8">
                    <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex items-end gap-4">
                        <div className="relative shrink-0">
                          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--app-surface)] bg-[var(--app-bg)] text-2xl font-bold text-[var(--app-muted)] shadow-md sm:h-28 sm:w-28">
                            {publicUploadUrl(profileUrl) ? (
                              <img
                                src={publicUploadUrl(profileUrl)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              displayInitial
                            )}
                          </div>
                          {avatarUploading ? (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                              <Loader2 className="h-7 w-7 animate-spin text-white" aria-hidden />
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => avatarFileRef.current?.click()}
                            disabled={avatarUploading}
                            className="absolute -bottom-0.5 -right-0.5 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[var(--app-surface)] bg-[var(--app-primary)] text-white shadow-md transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            aria-label="Change profile photo"
                            title="Change photo"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2.25} />
                          </button>
                        </div>
                        <div className="mb-1 min-w-0">
                          <p className="truncate text-lg font-semibold text-[var(--app-text)]">
                            {name.trim() || "Your name"}
                          </p>
                          <p className="truncate text-sm text-[var(--app-muted)]">
                            {email.trim() || phoneNumber.trim() || "Add contact info"}
                          </p>
                          <p className="mt-2 text-xs text-[var(--app-muted)]">
                            Tap the pencil on the banner or avatar to upload images — then save changes
                            below.
                          </p>
                          {profile.sectionCount != null ? (
                            <p className="mt-1 text-xs text-[var(--app-muted)]">
                              {profile.sectionCount} course section{profile.sectionCount === 1 ? "" : "s"}{" "}
                              linked
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {uploadNotice ? (
                  <div
                    className="flex items-start gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/45"
                    role="status"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-emerald-950 dark:text-emerald-100">Upload complete</p>
                      <p className="mt-0.5 leading-relaxed text-emerald-900/90 dark:text-emerald-200/95">
                        {uploadNotice}
                      </p>
                      <p className="mt-1.5 text-xs text-emerald-800/80 dark:text-emerald-300/85">
                        File is on the server — click <span className="font-semibold">Save changes</span>{" "}
                        to link it to your profile.
                      </p>
                    </div>
                  </div>
                ) : null}

                <div
                  className="rounded-2xl border bg-[var(--app-surface)] p-5 shadow-sm sm:p-8"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <h2 className="text-base font-semibold text-[var(--app-text)]">Basic info</h2>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Name and profession — cover and profile photos are set in the header above.
                  </p>
                  <Separator.Root className="my-5 h-px bg-[var(--app-border)]" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="set-name" label="Display name" hint="Your full name or brand name.">
                      <input
                        id="set-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        className="w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        style={{ borderColor: "var(--app-border)" }}
                      />
                    </Field>
                    <Field
                      id="set-profession"
                      label="Profession"
                      hint="What you teach or how you identify professionally."
                    >
                      <input
                        id="set-profession"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        maxLength={120}
                        className="w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        style={{ borderColor: "var(--app-border)" }}
                      />
                    </Field>
                  </div>
                </div>

                <div
                  className="rounded-2xl border bg-[var(--app-surface)] p-5 shadow-sm sm:p-8"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <h2 className="text-base font-semibold text-[var(--app-text)]">Contact</h2>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Used for account recovery and learner-facing contact where applicable.
                  </p>
                  <Separator.Root className="my-5 h-px bg-[var(--app-border)]" />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="set-email" label="Email">
                      <input
                        id="set-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        style={{ borderColor: "var(--app-border)" }}
                        autoComplete="email"
                      />
                    </Field>
                    <Field
                      id="set-phone"
                      label="Phone"
                      hint="Digits, spaces, +, -, and parentheses only."
                    >
                      <input
                        id="set-phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        style={{ borderColor: "var(--app-border)" }}
                        autoComplete="tel"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field id="set-address" label="Address" hint="Optional — city, region, or studio.">
                        <textarea
                          id="set-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={3}
                          maxLength={1000}
                          className="w-full resize-y rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm leading-relaxed text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                          style={{ borderColor: "var(--app-border)" }}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-2xl border bg-[var(--app-surface)] p-5 shadow-sm sm:p-8"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <h2 className="text-base font-semibold text-[var(--app-text)]">About you</h2>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    A short bio learners see on your profile (max 500 characters).
                  </p>
                  <Separator.Root className="my-5 h-px bg-[var(--app-border)]" />
                  <Field id="set-bio" label="Bio">
                    <textarea
                      id="set-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={5}
                      maxLength={500}
                      className="w-full resize-y rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm leading-relaxed text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      style={{ borderColor: "var(--app-border)" }}
                    />
                    <p className="text-right text-xs text-[var(--app-muted)]">{bio.length}/500</p>
                  </Field>
                </div>

                {profileErr ? (
                  <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {profileErr}
                  </p>
                ) : null}
                {profileMsg ? (
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{profileMsg}</p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="rounded-2xl px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #4338ca 100%)",
                    }}
                  >
                    {profileSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            )}

            {tab === "security" && (
              <div className="space-y-6">
                <div
                  className="rounded-2xl border bg-[var(--app-surface)] p-5 shadow-sm sm:p-8"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                      aria-hidden
                    >
                      <KeyRound className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-[var(--app-text)]">
                        {profile?.hasPassword ? "Change password" : "Create password"}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--app-muted)]">
                        {profile?.hasPassword ? (
                          <>
                            Secured with your collaborator account. After you change your password, your login
                            is refreshed automatically so you can keep working.
                          </>
                        ) : (
                          <>
                            No password is set on this collaborator account yet. Choose one (min. 8 characters)
                            to sign in from any device with email or phone.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <Separator.Root className="my-6 h-px bg-[var(--app-border)]" />
                  <form onSubmit={handleChangePassword} className="mx-auto max-w-md space-y-4">
                    {profile?.hasPassword ? (
                      <Field
                        id="set-cur-pw"
                        label="Current password"
                        hint="Required so only you can change it."
                      >
                        <input
                          id="set-cur-pw"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                          style={{ borderColor: "var(--app-border)" }}
                          autoComplete="current-password"
                        />
                      </Field>
                    ) : null}
                    <Field
                      id="set-new-pw"
                      label={profile?.hasPassword ? "New password" : "Password"}
                      hint="At least 8 characters."
                    >
                      <input
                        id="set-new-pw"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        style={{ borderColor: "var(--app-border)" }}
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field id="set-confirm-pw" label="Confirm password">
                      <input
                        id="set-confirm-pw"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        style={{ borderColor: "var(--app-border)" }}
                        autoComplete="new-password"
                      />
                    </Field>
                    {pwErr ? (
                      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                        {pwErr}
                      </p>
                    ) : null}
                    {pwMsg ? (
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{pwMsg}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={pwSaving}
                      className="w-full rounded-2xl px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60 sm:w-auto"
                      style={{
                        background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                      }}
                    >
                      {pwSaving
                        ? "Saving…"
                        : profile?.hasPassword
                          ? "Update password"
                          : "Create password"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
