/** API base (no trailing slash). Dev: Vite proxies `/api` → backend (see vite.config). */
export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "/api/v1";

/** When `VITE_API_BASE_URL` is absolute, use its origin for `/image` URLs in production. */
function inferUploadsOriginFromApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

/**
 * Resolve a stored profile/cover path or absolute URL for `<img src>`.
 *
 * - **Dev:** use relative `/image/…` so Vite can proxy to the API server (same tab origin).
 * - **Prod:** `VITE_UPLOADS_BASE_URL`, else origin from `VITE_API_BASE_URL`, else `window.location.origin`.
 */
export function publicUploadUrl(path: string | null | undefined): string {
  if (path == null) return "";
  const s = String(path).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const p = s.startsWith("/") ? s : `/${s}`;

  if (import.meta.env.DEV) {
    return p;
  }

  const explicit = (import.meta.env.VITE_UPLOADS_BASE_URL as string | undefined)?.replace(
    /\/$/,
    "",
  );
  const base = explicit || inferUploadsOriginFromApiBase();
  if (base) return `${base}${p}`;
  if (typeof window !== "undefined") return `${window.location.origin}${p}`;
  return p;
}
