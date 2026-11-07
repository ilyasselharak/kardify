import { Suspense } from "react";
import { AdminUserDetailView } from "@/components/admin/admin-user-detail-view";

/** Title is set by the client view (user ids are unknown at build time). */
export default function Page() {
  return (
    <Suspense>
      <AdminUserDetailView />
    </Suspense>
  );
}
