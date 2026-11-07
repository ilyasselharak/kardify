"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import type { LoginInput, RegisterInput, ResetPasswordInput } from "@/lib/validation/auth";
import { queryKeys } from "./query-keys";

export function useMe(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return (await api.get<{ user: User }>("/auth/me")).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
    enabled: options.enabled ?? true,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<{ user: User }>("/auth/login", input),
    onSuccess: ({ user }) => {
      qc.clear();
      qc.setQueryData(queryKeys.me, user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput & { language: string }) => api.post<{ user: User }>("/auth/register", input),
    onSuccess: ({ user }) => {
      qc.clear();
      qc.setQueryData(queryKeys.me, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(queryKeys.me, null);
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => api.post("/auth/forgot-password", { email }) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput & { token: string }) => api.post("/auth/reset-password", input),
  });
}

export function useVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ token, type }: { token: string; type?: string }) =>
      api.post(type === "email-change" ? "/users/email/confirm" : "/auth/verify-email", { token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email?: string) => api.post("/auth/resend-verification", email ? { email } : {}) });
}
