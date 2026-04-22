import { apiFetch } from "@/lib/api";

export type CollaboratorMe = {
  _id: string;
  name?: string | null;
  profile?: string | null;
  coverProfile?: string | null;
  phoneNumber?: string | null;
  profession?: string | null;
  professionValue?: string | null;
  email?: string | null;
  address?: string | null;
  bio?: string | null;
  sectionCount?: number;
  /** From GET/PATCH `/collaborator/me` — whether a sign-in password is already set. */
  hasPassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CollaboratorMeResponse = {
  success: boolean;
  message?: string;
  collaborator: CollaboratorMe;
  /** Present when PATCH changed password — new JWT; store in session. */
  access_token?: string;
  refresh_token?: string;
};

export function fetchCollaboratorMe() {
  return apiFetch<CollaboratorMeResponse>("/collaborator/me");
}

export type PatchCollaboratorMeBody = {
  name?: string | null;
  profile?: string | null;
  coverProfile?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  bio?: string | null;
  profession?: string | null;
  professionValue?: string | null;
  currentPassword?: string | null;
  newPassword?: string | null;
};

export function patchCollaboratorMe(body: PatchCollaboratorMeBody) {
  return apiFetch<CollaboratorMeResponse>("/collaborator/me", {
    method: "PATCH",
    json: body,
  });
}