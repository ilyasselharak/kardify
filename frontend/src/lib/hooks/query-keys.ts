export const queryKeys = {
  me: ["auth", "me"] as const,
  features: ["features"] as const,
  cards: (params?: object) => ["cards", "list", params ?? {}] as const,
  cardsAll: ["cards"] as const,
  card: (id: string) => ["cards", "detail", id] as const,
  share: (id: string) => ["cards", "share", id] as const,
  overview: (range: string) => ["analytics", "overview", range] as const,
  cardAnalytics: (id: string, range: string) => ["analytics", "card", id, range] as const,
  sessions: ["sessions"] as const,
};
