import { Suspense } from "react";
import { EditCardView } from "@/components/dashboard/views/edit-card-view";

/** Per-user page: the document title is set by the client view (params are unknown at build time). */
export default function Page() {
  return (
    <Suspense>
      <EditCardView />
    </Suspense>
  );
}
