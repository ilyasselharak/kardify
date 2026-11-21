import { Suspense } from "react";
import { AdminCompanyView } from "@/components/admin/admin-company-view";

/** Company detail (?name=…); the document title is set by the client view. */
export default function Page() {
  return (
    <Suspense>
      <AdminCompanyView />
    </Suspense>
  );
}
