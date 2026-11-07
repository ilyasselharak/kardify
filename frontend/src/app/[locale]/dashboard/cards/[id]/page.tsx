import { Suspense } from "react";
import { CardDetailView } from "@/components/dashboard/views/card-detail-view";

/** Per-user page: the document title is set by the client view (params are unknown at build time). */
export default function Page() {
  return (
    <Suspense>
      <CardDetailView />
    </Suspense>
  );
}
