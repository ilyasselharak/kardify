"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { BusinessCard, CardFields, CardStatus, Paginated, QrSettings, ShareLinks } from "@/lib/api/types";
import { queryKeys } from "./query-keys";

export interface CardListParams {
  search?: string;
  status?: CardStatus;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}

export function useCards(params: CardListParams = {}) {
  return useQuery({
    queryKey: queryKeys.cards(params),
    queryFn: ({ signal }) =>
      api.get<Paginated<BusinessCard>>("/cards", { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useCard(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.card(id ?? ""),
    queryFn: () => api.get<BusinessCard>(`/cards/${id}`),
    enabled: !!id,
  });
}

export function useShareLinks(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.share(id),
    queryFn: () => api.get<ShareLinks>(`/cards/${id}/share`),
    enabled,
  });
}

/** Keeps list + detail caches consistent after any card mutation. */
function useCardMutation<TVars>(fn: (vars: TVars) => Promise<BusinessCard | void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (card) => {
      if (card) qc.setQueryData(queryKeys.card(card.id), card);
      qc.invalidateQueries({ queryKey: queryKeys.cardsAll });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export type CardPayload = Partial<CardFields>;

export const useCreateCard = () => useCardMutation((data: CardPayload) => api.post<BusinessCard>("/cards", data));
export const useUpdateCard = () =>
  useCardMutation(({ id, data }: { id: string; data: CardPayload }) => api.patch<BusinessCard>(`/cards/${id}`, data));
export const useDeleteCard = () => useCardMutation((id: string) => api.delete<void>(`/cards/${id}`));
export const useDuplicateCard = () => useCardMutation((id: string) => api.post<BusinessCard>(`/cards/${id}/duplicate`));
export const usePublishCard = () => useCardMutation((id: string) => api.post<BusinessCard>(`/cards/${id}/publish`));
export const useUnpublishCard = () => useCardMutation((id: string) => api.post<BusinessCard>(`/cards/${id}/unpublish`));
export const useRegenerateLink = () => useCardMutation((id: string) => api.post<BusinessCard>(`/cards/${id}/regenerate-link`));
export const useUpdateQrSettings = () =>
  useCardMutation(({ id, data }: { id: string; data: QrSettings }) => api.patch<BusinessCard>(`/cards/${id}/qr-settings`, data));
