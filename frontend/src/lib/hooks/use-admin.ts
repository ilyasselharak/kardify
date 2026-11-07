"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AdminCard, AdminStats, AdminUser, AdminUserDetail, AuditLogEntry, CardStatus, Paginated, Role } from "@/lib/api/types";

const keys = {
  all: ["admin"] as const,
  stats: ["admin", "stats"] as const,
  users: (p: object) => ["admin", "users", p] as const,
  user: (id: string) => ["admin", "user", id] as const,
  cards: (p: object) => ["admin", "cards", p] as const,
  audit: (p: object) => ["admin", "audit", p] as const,
};

export interface AdminUsersParams {
  search?: string;
  role?: Role;
  status?: "active" | "suspended" | "unverified";
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}

export const useAdminStats = () => useQuery({ queryKey: keys.stats, queryFn: () => api.get<AdminStats>("/admin/stats") });

export const useAdminUsers = (params: AdminUsersParams) =>
  useQuery({
    queryKey: keys.users(params),
    queryFn: ({ signal }) => api.get<Paginated<AdminUser>>("/admin/users", { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
  });

export const useAdminUser = (id: string | undefined) =>
  useQuery({ queryKey: keys.user(id ?? ""), queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`), enabled: !!id });

export const useAdminCards = (params: { search?: string; status?: CardStatus; page?: number; pageSize?: number }) =>
  useQuery({
    queryKey: keys.cards(params),
    queryFn: ({ signal }) => api.get<Paginated<AdminCard>>("/admin/cards", { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
  });

export const useAuditLog = (params: { page?: number; pageSize?: number }) =>
  useQuery({
    queryKey: keys.audit(params),
    queryFn: () => api.get<Paginated<AuditLogEntry>>("/admin/audit-log", { query: { ...params } }),
    placeholderData: keepPreviousData,
  });

/** Every admin mutation refreshes all admin views (lists, details, stats, audit log). */
function useAdminMutation<TVars, TResult = unknown>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export const useAdminUpdateUser = () =>
  useAdminMutation(({ id, data }: { id: string; data: Partial<Pick<AdminUser, "firstName" | "lastName" | "preferredLanguage" | "role" | "emailVerified">> }) =>
    api.patch<AdminUser>(`/admin/users/${id}`, data),
  );
export const useAdminSuspendUser = () =>
  useAdminMutation(({ id, suspend }: { id: string; suspend: boolean }) => api.post<AdminUser>(`/admin/users/${id}/${suspend ? "suspend" : "unsuspend"}`));
export const useAdminRevokeSessions = () => useAdminMutation((id: string) => api.post<void>(`/admin/users/${id}/revoke-sessions`));
export const useAdminDeleteUser = () => useAdminMutation((id: string) => api.delete<void>(`/admin/users/${id}`));
export const useAdminSetCardStatus = () =>
  useAdminMutation(({ id, active }: { id: string; active: boolean }) => api.post(`/admin/cards/${id}/${active ? "activate" : "deactivate"}`));
export const useAdminDeleteCard = () => useAdminMutation((id: string) => api.delete<void>(`/admin/cards/${id}`));
