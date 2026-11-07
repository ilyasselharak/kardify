import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: LayoutProps<"/[locale]/dashboard/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
