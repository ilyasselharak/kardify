"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Direction } from "radix-ui";
import { useState } from "react";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api/client";
import { hardNavigate } from "@/lib/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";

function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function Providers({ children, dir }: { children: React.ReactNode; dir: "ltr" | "rtl" }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            // Session expired while using the app: send the user back to login.
            if (error instanceof ApiError && error.status === 401 && window.location.pathname.includes("/dashboard")) {
              const locale = window.location.pathname.split("/")[1] || "en";
              hardNavigate(`/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`);
            }
          },
        }),
        mutationCache: new MutationCache(),
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <Direction.Provider dir={dir}>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster dir={dir} position={dir === "rtl" ? "bottom-left" : "bottom-right"} richColors closeButton />
        </TooltipProvider>
      </Direction.Provider>
    </QueryClientProvider>
  );
}
