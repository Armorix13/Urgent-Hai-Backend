type JwtPayloadShape = {
  _id?: string;
  authKind?: string;
};

function decodeJwtPayload(token: string): JwtPayloadShape | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    return JSON.parse(atob(padded)) as JwtPayloadShape;
  } catch {
    return null;
  }
}

/** Read collaborator Mongo id from JWT payload (no verification — UI hint only). */
export function readCollaboratorIdFromAccessToken(
  token: string | undefined,
): string | undefined {
  if (!token || typeof token !== "string") return undefined;
  const json = decodeJwtPayload(token);
  if (json?.authKind === "collaborator" && json?._id) return String(json._id);
  return undefined;
}

/**
 * Learner user id from access token (user JWT has no `authKind`; collaborator JWT sets `authKind: "collaborator"`).
 */
export function readLearnerUserIdFromAccessToken(
  token: string | undefined,
): string | undefined {
  if (!token || typeof token !== "string") return undefined;
  const json = decodeJwtPayload(token);
  if (!json?._id) return undefined;
  if (json.authKind === "collaborator") return undefined;
  return String(json._id);
}
