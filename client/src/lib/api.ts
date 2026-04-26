import { COLLABORATOR_TOKEN_STORAGE_KEY } from "../context/AuthContext";
import { isUnauthorizedJwtExpired, notifyAuthExpired } from "./authExpired";
import { API_BASE } from "./env";

const SESSION_KEY = "raag-session";

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const u = JSON.parse(raw) as { accessToken?: string };
      const t = u.accessToken && u.accessToken !== "null" ? u.accessToken : null;
      if (t) return t;
    }
    const collab = localStorage.getItem(COLLABORATOR_TOKEN_STORAGE_KEY);
    if (collab && collab !== "null" && collab.trim() !== "") return collab;
    return null;
  } catch {
    return null;
  }
}

export type ApiErrorBody = { message?: string; status?: number };

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    if (isUnauthorizedJwtExpired(res.status, data)) notifyAuthExpired();
    const msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as ApiErrorBody).message)
        : res.statusText;
    throw new ApiError(msg || `Request failed (${res.status})`, res.status, data);
  }

  return data as T;
}

/** Normalized `POST /file-upload` JSON (matches `upload.controller.js`). */
export type FileUploadResponse = {
  success: boolean;
  message: string;
  url: string;
  filename?: string;
  mimetype?: string;
};

function normalizeStoredUploadUrl(u: string): string {
  const s = u.trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

/**
 * POST multipart field `image` to `/file-upload`.
 * Returns the API body so callers can show `message` (e.g. “Image uploaded successfully”).
 */
export async function uploadImageFile(file: File): Promise<FileUploadResponse> {
  const fd = new FormData();
  fd.append("image", file);
  const headers = new Headers();
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = `${API_BASE}/file-upload`;
  const res = await fetch(url, { method: "POST", headers, body: fd });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    if (isUnauthorizedJwtExpired(res.status, data)) notifyAuthExpired();
    const msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as ApiErrorBody).message)
        : res.statusText;
    throw new ApiError(msg || `Upload failed (${res.status})`, res.status, data);
  }

  const parsed = data as Partial<FileUploadResponse>;
  const raw = parsed.url != null ? String(parsed.url) : "";
  const normalized = normalizeStoredUploadUrl(raw);
  if (!normalized) {
    throw new ApiError("Upload returned no URL", res.status, data);
  }

  return {
    success: Boolean(parsed.success ?? true),
    message: String(parsed.message ?? "File uploaded successfully"),
    url: normalized,
    filename: parsed.filename != null ? String(parsed.filename) : undefined,
    mimetype: parsed.mimetype != null ? String(parsed.mimetype) : undefined,
  };
}
