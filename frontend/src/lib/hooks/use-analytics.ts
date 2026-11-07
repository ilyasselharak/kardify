"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AnalyticsOverview, AnalyticsRange, CardAnalytics } from "@/lib/api/types";
import { queryKeys } from "./query-keys";

export function useAnalyticsOverview(range: AnalyticsRange) {
  return useQuery({
    queryKey: queryKeys.overview(range),
    queryFn: () => api.get<AnalyticsOverview>("/analytics/overview", { query: { range } }),
    placeholderData: keepPreviousData,
  });
}

export function useCardAnalytics(cardId: string | undefined, range: AnalyticsRange) {
  return useQuery({
    queryKey: queryKeys.cardAnalytics(cardId ?? "", range),
    queryFn: () => api.get<CardAnalytics>(`/analytics/cards/${cardId}`, { query: { range } }),
    enabled: !!cardId,
    placeholderData: keepPreviousData,
  });
}
