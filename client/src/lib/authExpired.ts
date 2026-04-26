/**
 * When the API returns 401 with a JWT expiry message, we clear the session and
 * send the user to login. `AuthProvider` registers the handler (logout + redirect).
 */

type AuthExpiredHandler = () => void;

let handler: AuthExpiredHandler | null = null;

export function setAuthExpiredHandler(fn: AuthExpiredHandler | null) {
  handler = fn;
}

export function notifyAuthExpired() {
  handler?.();
}

export function isUnauthorizedJwtExpired(status: number, body: unknown): boolean {
  if (status !== 401) return false;
  let msg = "";
  if (typeof body === "object" && body !== null && "message" in body) {
    const m = (body as { message?: unknown }).message;
    msg = m != null ? String(m).toLowerCase().trim() : "";
  }
  if (!msg) return false;
  return (
    msg === "jwt expired" ||
    (msg.includes("jwt") && msg.includes("expir")) ||
    (msg.includes("token") && msg.includes("expir"))
  );
}
