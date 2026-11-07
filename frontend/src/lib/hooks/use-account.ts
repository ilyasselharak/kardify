"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Features, SessionInfo, User, UserPreferences } from "@/lib/api/types";
import { queryKeys } from "./query-keys";

export function useFeatures() {
  return useQuery({
    queryKey: queryKeys.features,
    queryFn: () => api.get<Features>("/features"),
    staleTime: 5 * 60_000,
  });
}

function useUserMutation<TVars>(fn: (vars: TVars) => Promise<{ user: User }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: ({ user }) => qc.setQueryData(queryKeys.me, user),
  });
}

export const useUpdateProfile = () =>
  useUserMutation((data: { firstName?: string; lastName?: string; preferredLanguage?: string; profileImage?: string | null }) =>
    api.patch<{ user: User }>("/users/me", data),
  );

export const useUpdatePreferences = () =>
  useUserMutation((data: UserPreferences) => api.patch<{ user: User }>("/users/me/preferences", data));

export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      api.post<void>("/users/me/password", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: (data: { newEmail: string; password: string }) => api.post("/users/me/email", data),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => api.delete<void>("/users/me", { password }),
    onSuccess: () => qc.clear(),
  });
}

export function useSessions() {
  return useQuery({ queryKey: queryKeys.sessions, queryFn: () => api.get<SessionInfo[]>("/sessions") });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/sessions/revoke-others"),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions }),
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: ({ file, purpose }: { file: File; purpose: "avatar" | "profile" | "logo" }) => {
      const form = new FormData();
      form.append("file", file);
      return api.post<{ url: string }>(`/uploads/images/${purpose}`, form);
    },
  });
}
