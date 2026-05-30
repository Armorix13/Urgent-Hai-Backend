import { apiFetch } from "@/lib/api";

export type CollaboratorBandish = {
  sId: number;
  bandishName: string;
  pdfUrl?: string | null;
  audioUrl?: string | null;
};

export type CollaboratorRaagDetails = {
  _id?: string;
  raag: string;
  sur?: string | null;
  thaat?: string | null;
  wargitSur?: string | null;
  jaati?: string | null;
  time?: string | null;
  vaadi?: string | null;
  samvadi?: string | null;
  aroh?: string | null;
  avroh?: string | null;
  audioUrl?: string | null;
  listOfBandish: CollaboratorBandish[];
};

export type CollaboratorRaag = {
  _id: string;
  id: number;
  name: string;
  details: CollaboratorRaagDetails | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CollaboratorRaagsResponse = {
  success: boolean;
  raags: CollaboratorRaag[];
};

export type CollaboratorRaagSingleResponse = {
  success: boolean;
  raag: CollaboratorRaag;
};

export type CollaboratorRaagMutateResponse = {
  success: boolean;
  message?: string;
  raag?: CollaboratorRaag;
};

export function fetchCollaboratorRaags() {
  return apiFetch<CollaboratorRaagsResponse>("/collaborator-raags");
}

export function fetchCollaboratorRaagById(id: string) {
  return apiFetch<CollaboratorRaagSingleResponse>(`/collaborator-raags/${id}`);
}

export type MutateRaagBody = {
  name: string;
  sur?: string | null;
  thaat?: string | null;
  wargitSur?: string | null;
  jaati?: string | null;
  time?: string | null;
  vaadi?: string | null;
  samvadi?: string | null;
  aroh?: string | null;
  avroh?: string | null;
  audioUrl?: string | null;
  listOfBandish?: CollaboratorBandish[];
};

export function createCollaboratorRaag(body: MutateRaagBody) {
  return apiFetch<CollaboratorRaagMutateResponse>("/collaborator-raags", {
    method: "POST",
    json: body,
  });
}

export function updateCollaboratorRaag(id: string, body: MutateRaagBody) {
  return apiFetch<CollaboratorRaagMutateResponse>(`/collaborator-raags/${id}`, {
    method: "PUT",
    json: body,
  });
}

export function deleteCollaboratorRaag(id: string) {
  return apiFetch<{ success: boolean; message?: string }>(`/collaborator-raags/${id}`, {
    method: "DELETE",
  });
}
