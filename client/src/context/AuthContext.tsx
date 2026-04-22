import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { readCollaboratorIdFromAccessToken } from "../lib/jwtPayload";

const STORAGE_KEY = "raag-session";

/** Dedicated collaborator session keys (token + profile JSON). */
export const COLLABORATOR_TOKEN_STORAGE_KEY = "collaboratorToken";
export const COLLABORATOR_USER_STORAGE_KEY = "collaboratorUser";

export type AuthUser = {
  email: string;
  displayName: string;
  /** JWT from `POST /user/user-login` or `POST /collaborator/login` */
  accessToken?: string;
  accountType?: "user" | "collaborator";
  /** Set for collaborators — used as `collaboratorId` on `POST /course`. */
  collaboratorId?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  /** Merge into the current session (e.g. after profile save). */
  patchUser: (partial: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const collabToken = localStorage.getItem(COLLABORATOR_TOKEN_STORAGE_KEY);
    const collabUserRaw = localStorage.getItem(COLLABORATOR_USER_STORAGE_KEY);
    if (collabToken && collabUserRaw) {
      const parsed = JSON.parse(collabUserRaw) as {
        email?: string;
        displayName?: string;
        accountType?: "user" | "collaborator";
        collaboratorId?: string;
      };
      const collaboratorId =
        parsed.collaboratorId ?? readCollaboratorIdFromAccessToken(collabToken);
      return {
        email: parsed.email ?? "",
        displayName: parsed.displayName ?? "Collaborator",
        accessToken: collabToken,
        accountType: parsed.accountType ?? "collaborator",
        collaboratorId,
      };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => parseStored());

  const login = useCallback((next: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (next.accountType === "collaborator" && next.accessToken) {
      localStorage.setItem(COLLABORATOR_TOKEN_STORAGE_KEY, next.accessToken);
      localStorage.setItem(
        COLLABORATOR_USER_STORAGE_KEY,
        JSON.stringify({
          email: next.email,
          displayName: next.displayName,
          accountType: "collaborator",
          collaboratorId:
            next.collaboratorId ??
            readCollaboratorIdFromAccessToken(next.accessToken),
        }),
      );
    }
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COLLABORATOR_TOKEN_STORAGE_KEY);
    localStorage.removeItem(COLLABORATOR_USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const patchUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: AuthUser = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (next.accountType === "collaborator" && next.accessToken) {
        localStorage.setItem(COLLABORATOR_TOKEN_STORAGE_KEY, next.accessToken);
        localStorage.setItem(
          COLLABORATOR_USER_STORAGE_KEY,
          JSON.stringify({
            email: next.email,
            displayName: next.displayName,
            accountType: "collaborator",
            collaboratorId:
              next.collaboratorId ??
              readCollaboratorIdFromAccessToken(next.accessToken),
          }),
        );
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, patchUser }),
    [user, login, logout, patchUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
