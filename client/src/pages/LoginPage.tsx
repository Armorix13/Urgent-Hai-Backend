import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { useAuth } from "../context/AuthContext";
import { readCollaboratorIdFromAccessToken } from "../lib/jwtPayload";
import { API_BASE } from "../lib/env";
import { ROUTES } from "../routes/paths";
import { useTheme } from "../context/ThemeContext";

const brandName = "Raag App";

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light"
      aria-hidden
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

function DecorativeFrames() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -left-[12%] top-[8%] h-[58%] w-[85%] rounded-[2.75rem] border border-indigo-950/35 bg-indigo-950/[0.07] shadow-sm backdrop-blur-[2px] sm:rotate-[-8deg]" />
      <div className="absolute -left-[8%] top-[18%] h-[52%] w-[78%] rounded-[2.5rem] border border-indigo-950/25 sm:rotate-[-14deg]" />
      <div className="absolute left-[6%] top-[28%] h-[42%] w-[68%] rounded-[2rem] border border-white/10 sm:rotate-[-20deg]" />
    </div>
  );
}

function EightPointStar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 28 28)`}>
          <rect x="24" y="6" width="8" height="20" rx="3" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

type ResolvedProfile = {
  hasPassword: boolean;
  email: string | null;
  phoneNumber: string | null;
  name: string | null;
};

type ModalPhase = "password" | "setPassword";

function loginPayloadForProfile(
  profile: ResolvedProfile,
  password: string,
): Record<string, unknown> {
  const hasEmail = profile.email != null && profile.email !== "";
  if (hasEmail) {
    return { email: profile.email, password, deviceType: 1 };
  }
  return {
    phoneNumber: profile.phoneNumber ?? "",
    password,
    deviceType: 1,
  };
}

function setPasswordBody(profile: ResolvedProfile, password: string) {
  const body: { password: string; email?: string; phoneNumber?: string } = {
    password,
  };
  if (profile.email != null && profile.email !== "") {
    body.email = profile.email;
  }
  if (profile.phoneNumber != null && profile.phoneNumber !== "") {
    body.phoneNumber = profile.phoneNumber;
  }
  return body;
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [resolvedProfile, setResolvedProfile] = useState<ResolvedProfile | null>(
    null,
  );
  const [modalPhase, setModalPhase] = useState<ModalPhase>("password");

  const [modalPassword, setModalPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [setupHint, setSetupHint] = useState<string | null>(null);

  if (user) {
    return <Navigate to={ROUTES.dashboard.home} replace />;
  }

  function resetModal() {
    setResolvedProfile(null);
    setModalPhase("password");
    setModalPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setModalError(null);
    setSetupHint(null);
    setModalBusy(false);
  }

  function onModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) resetModal();
  }

  async function handleContinue(e: FormEvent) {
    e.preventDefault();
    setLookupError(null);
    const trimmed = identifier.trim();
    if (!trimmed) {
      setLookupError("Enter your email or phone number.");
      return;
    }
    const looksLikeEmail = trimmed.includes("@");
    setLookupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/collaborator/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          looksLikeEmail
            ? { email: trimmed.toLowerCase() }
            : { phoneNumber: trimmed },
        ),
      });
      const data = (await res.json()) as {
        message?: string;
        hasPassword?: boolean;
        email?: string | null;
        phoneNumber?: string | null;
        name?: string | null;
      };
      if (!res.ok) {
        throw new Error(data.message || "Could not find a collaborator profile.");
      }
      const profile: ResolvedProfile = {
        hasPassword: Boolean(data.hasPassword),
        email: data.email ?? null,
        phoneNumber: data.phoneNumber ?? null,
        name: data.name ?? null,
      };
      setResolvedProfile(profile);
      setModalPhase(profile.hasPassword ? "password" : "setPassword");
      setModalPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setModalError(null);
      setSetupHint(null);
      setModalOpen(true);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleModalLogin(e: FormEvent) {
    e.preventDefault();
    setModalError(null);
    setSetupHint(null);
    if (!resolvedProfile) return;
    if (modalPassword.length < 8) {
      setModalError("Password must be at least 8 characters.");
      return;
    }
    setModalBusy(true);
    try {
      const body = loginPayloadForProfile(resolvedProfile, modalPassword);
      const res = await fetch(`${API_BASE}/collaborator/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        message?: string;
        needsPasswordSetup?: boolean;
        collaborator?: {
          _id?: string;
          name?: string;
          email?: string;
          phoneNumber?: string;
          access_token?: string;
        };
      };
      if (res.status === 403 && data.needsPasswordSetup) {
        setModalPhase("setPassword");
        setModalError(null);
        setSetupHint(
          data.message ??
            "You still need to create a password. Use the form below, then sign in.",
        );
        return;
      }
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      const c = data.collaborator;
      if (!c?.access_token) {
        throw new Error("No access token returned.");
      }
      const displayName =
        (c.name && c.name.trim()) ||
        c.email?.split("@")[0] ||
        c.phoneNumber ||
        "Collaborator";
      const fromDoc = c._id != null ? String(c._id) : "";
      const collaboratorId =
        fromDoc || readCollaboratorIdFromAccessToken(c.access_token) || undefined;
      login({
        email:
          c.email ?? resolvedProfile.email ?? c.phoneNumber ?? identifier.trim(),
        displayName,
        accessToken: c.access_token,
        accountType: "collaborator",
        collaboratorId,
      });
      setModalOpen(false);
      resetModal();
      navigate(ROUTES.dashboard.home, { replace: true });
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setModalBusy(false);
    }
  }

  async function handleModalSetPassword(e: FormEvent) {
    e.preventDefault();
    setModalError(null);
    if (!resolvedProfile) return;
    if (newPassword !== confirmNewPassword) {
      setModalError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setModalError("Password must be at least 8 characters.");
      return;
    }
    setModalBusy(true);
    try {
      const res = await fetch(`${API_BASE}/collaborator/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setPasswordBody(resolvedProfile, newPassword)),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Could not set password");
      }
      setResolvedProfile((p) => (p ? { ...p, hasPassword: true } : p));
      setModalPhase("password");
      setNewPassword("");
      setConfirmNewPassword("");
      setModalPassword("");
      setModalError(null);
      setSetupHint("Password saved. Enter it below to sign in.");
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Could not set password");
    } finally {
      setModalBusy(false);
    }
  }

  const displayLabel =
    resolvedProfile?.name?.trim() ||
    resolvedProfile?.email ||
    resolvedProfile?.phoneNumber ||
    "Collaborator";

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--app-page)] antialiased lg:flex-row">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm transition hover:bg-[var(--app-page)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-page)] lg:right-6 lg:top-6"
        style={{ borderColor: "var(--app-border)" }}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <Dialog.Root open={modalOpen} onOpenChange={onModalOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] dark:bg-black/70" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[101] w-[min(92vw,420px)] max-h-[min(90vh,640px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-[var(--app-surface)] p-6 shadow-xl dark:shadow-black/40 focus:outline-none"
            style={{ borderColor: "var(--app-border)" }}
          >
            <Dialog.Description className="sr-only">
              Enter or create your collaborator password to continue.
            </Dialog.Description>
            <Dialog.Title className="text-lg font-semibold text-[var(--app-text)]">
              {modalPhase === "password" ? "Enter password" : "Create password"}
            </Dialog.Title>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              {resolvedProfile ? (
                <>
                  Signing in as{" "}
                  <span className="font-medium text-[var(--app-text)]">{displayLabel}</span>
                </>
              ) : null}
            </p>

            {setupHint && (
              <p
                className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                role="status"
              >
                {setupHint}
              </p>
            )}

            {modalError && (
              <p
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {modalError}
              </p>
            )}

            {modalPhase === "setPassword" ? (
              <form className="mt-6 space-y-4" onSubmit={handleModalSetPassword}>
                <p className="text-xs leading-relaxed text-[var(--app-muted)]">
                  No password is set for this profile yet. Choose at least 8 characters.
                </p>
                <div>
                  <label htmlFor="modal-new-pass" className="sr-only">
                    New password
                  </label>
                  <input
                    id="modal-new-pass"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-lg border bg-[var(--app-page)] px-3 py-2.5 text-[15px] text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]/30"
                    style={{ borderColor: "var(--app-border)" }}
                  />
                </div>
                <div>
                  <label htmlFor="modal-confirm-pass" className="sr-only">
                    Confirm password
                  </label>
                  <input
                    id="modal-confirm-pass"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full rounded-lg border bg-[var(--app-page)] px-3 py-2.5 text-[15px] text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]/30"
                    style={{ borderColor: "var(--app-border)" }}
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg border px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-page)] dark:hover:bg-white/[0.06]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={modalBusy}
                    className="rounded-lg bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-surface)] disabled:opacity-60"
                  >
                    {modalBusy ? "Saving…" : "Save password"}
                  </button>
                </div>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleModalLogin}>
                <div>
                  <label htmlFor="modal-pass" className="sr-only">
                    Password
                  </label>
                  <input
                    id="modal-pass"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-lg border bg-[var(--app-page)] px-3 py-2.5 text-[15px] text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)]/30"
                    style={{ borderColor: "var(--app-border)" }}
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg border px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-page)] dark:hover:bg-white/[0.06]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      Back
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={modalBusy}
                    className="rounded-lg bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-surface)] disabled:opacity-60"
                  >
                    {modalBusy ? "Signing in…" : "Sign in"}
                  </button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <section
        className="relative flex min-h-[38vh] flex-col justify-between overflow-hidden px-8 pb-8 pt-10 text-white sm:px-12 sm:pb-12 sm:pt-14 lg:min-h-screen lg:w-[58%] lg:px-16 lg:pb-14 lg:pt-16 xl:px-20 xl:pb-20 xl:pt-20"
        style={{
          background:
            "radial-gradient(120% 90% at 0% 0%, #3b5cff 0%, #1e3fcc 38%, #152a9e 100%)",
        }}
      >
        <NoiseOverlay />
        <DecorativeFrames />
        <div className="absolute bottom-0 right-0 h-[45%] w-[55%] bg-gradient-to-tl from-indigo-950/30 to-transparent opacity-90" />

        <div className="relative z-[1] max-w-xl">
          <EightPointStar className="mb-8 h-14 w-14 text-white drop-shadow-sm sm:h-16 sm:w-16" />
          <h1 className="font-semibold tracking-tight text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.15] text-white">
            Hello {brandName}! <span aria-hidden>👋</span>
          </h1>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-white/90 sm:text-base">
            Collaborator access for courses and content. Start with your email or phone—we
            will guide you through password or setup.
          </p>
        </div>

        <p className="relative z-[1] text-xs text-indigo-200/85 sm:text-sm">
          © {new Date().getFullYear()} {brandName}. All rights reserved.
        </p>

        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden w-px bg-gradient-to-b from-transparent via-indigo-950/40 to-transparent lg:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 -right-1 z-[2] hidden w-8 bg-gradient-to-r from-indigo-950/25 to-transparent lg:block"
          aria-hidden
        />
      </section>

      <section
        className="relative flex flex-1 flex-col justify-center border-t border-[var(--app-border)] px-8 pb-12 pt-10 shadow-[-12px_0_32px_-16px_rgba(15,23,42,0.12)] sm:px-12 sm:pb-16 sm:pt-12 lg:w-[42%] lg:border-t-0 lg:border-l lg:px-14 lg:py-16 lg:shadow-[-12px_0_32px_-16px_rgba(15,23,42,0.1)] xl:px-20 dark:shadow-[-8px_0_40px_-12px_rgba(0,0,0,0.55)]"
        style={{ background: "var(--app-surface)", borderLeftColor: "var(--app-border)" }}
      >
        <div className="mx-auto w-full max-w-md">
          <p
            className="text-center text-xl font-bold tracking-tight sm:text-2xl"
            style={{ color: "var(--app-text)" }}
          >
            {brandName}
          </p>

          <p
            className="mt-2 text-center text-xs font-medium uppercase tracking-[0.12em] text-[var(--app-muted)]"
            aria-hidden
          >
            Collaborator
          </p>

          <h2 className="font-display mt-6 text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">
            Sign in
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
            Step 1: enter the email or phone number on your collaborator profile. We check
            whether a password exists, then ask for it or help you create one.
          </p>

          <form className="mt-10 space-y-8" onSubmit={handleContinue} noValidate>
            {lookupError && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {lookupError}
              </div>
            )}
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email or phone number
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setLookupError(null);
                }}
                placeholder="Email or phone number"
                className="w-full rounded-none border-0 border-b border-[var(--app-border)] bg-transparent py-2.5 text-[15px] text-[var(--app-text)] placeholder:text-[var(--app-muted)] outline-none transition-colors focus:border-[var(--app-primary)] focus:ring-0"
              />
            </div>

            <button
              type="submit"
              disabled={lookupLoading}
              className="flex w-full items-center justify-center rounded-xl bg-[var(--app-primary)] py-3.5 text-[15px] font-semibold text-white shadow-md transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-surface)] disabled:opacity-60"
            >
              {lookupLoading ? "Checking…" : "Continue"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-[var(--app-muted)]">
            Need access? Contact your administrator.
          </p>
        </div>
      </section>
    </div>
  );
}
