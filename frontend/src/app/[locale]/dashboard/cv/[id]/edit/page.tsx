import { Suspense } from "react";
import { CvEditView } from "@/components/cv/cv-edit-view";

/** Per-user page: the document title is set by the client view (params are unknown at build time). */
export default function Page() {
  return (
    <Suspense>
      <CvEditView />
    </Suspense>
  );
}
