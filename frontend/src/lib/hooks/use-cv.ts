"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Cv, CvList, CvProfile, CvTemplateId, CvVisibility } from "@/lib/cv/types";
import { queryKeys } from "./query-keys";

export function useCvList() {
  return useQuery({ queryKey: queryKeys.cvs, queryFn: ({ signal }) => api.get<CvList>("/cvs", { signal }) });
}

export function useCv(id: string | undefined) {
  return useQuery({ queryKey: queryKeys.cv(id ?? ""), queryFn: () => api.get<Cv>(`/cvs/${id}`), enabled: !!id });
}

export function useCvProfile() {
  return useQuery({ queryKey: queryKeys.cvProfile, queryFn: () => api.get<CvProfile>("/cv-profile") });
}

/** Keeps list + detail caches consistent after any CV mutation. */
function useCvMutation<TVars, TResult extends Cv | void>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cv) => {
      if (cv) qc.setQueryData(queryKeys.cv(cv.id), cv);
      void qc.invalidateQueries({ queryKey: queryKeys.cvs });
    },
  });
}

export interface CreateCvPayload {
  title: string;
  template?: CvTemplateId;
  language?: "en" | "ar";
  copyFromId?: string;
}

export interface CvSharingPayload {
  visibility?: CvVisibility;
  allowDownload?: boolean;
  linkEnabled?: boolean;
  slug?: string;
}

export const useCreateCv = () => useCvMutation((data: CreateCvPayload) => api.post<Cv>("/cvs", data));
export const useDuplicateCv = () => useCvMutation((id: string) => api.post<Cv>(`/cvs/${id}/duplicate`));
export const useDeleteCv = () => useCvMutation((id: string) => api.delete<void>(`/cvs/${id}`));
export const useRenameCv = () => useCvMutation(({ id, title }: { id: string; title: string }) => api.patch<Cv>(`/cvs/${id}`, { title }));
export const useUpdateCvSharing = () =>
  useCvMutation(({ id, data }: { id: string; data: CvSharingPayload }) => api.patch<Cv>(`/cvs/${id}/sharing`, data));

export function checkSlug(id: string, slug: string) {
  return api.get<{ available: boolean; valid: boolean }>(`/cvs/${id}/slug-available`, { query: { slug } });
}
