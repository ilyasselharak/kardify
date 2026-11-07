"use client";

import { Search, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";
import { EmptyState, ErrorState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAdminUsers, type AdminUsersParams } from "@/lib/hooks/use-admin";
import { useMe } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatDate } from "@/lib/utils";
import { AdminTable, Pager, RoleBadge, UserCell, UserStatusBadges } from "./admin-ui";
import { UserActionsMenu } from "./user-actions";

const PAGE_SIZE = 20;

export function AdminUsersView() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const { data: me } = useMe();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AdminUsersParams["role"] | "ALL">("ALL");
  const [status, setStatus] = useState<AdminUsersParams["status"] | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const q = useDeferredValue(search.trim());
  const users = useAdminUsers({
    search: q || undefined,
    role: role === "ALL" ? undefined : role,
    status: status === "ALL" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" className="ps-9" placeholder={t("searchUsers")} aria-label={tc("search")} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v as typeof role); setPage(1); }}>
          <SelectTrigger className="sm:w-40" aria-label={t("columns.role")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allRoles")}</SelectItem>
            <SelectItem value="USER">{t("roles.USER")}</SelectItem>
            <SelectItem value="ADMIN">{t("roles.ADMIN")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
          <SelectTrigger className="sm:w-44" aria-label={t("columns.status")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
            <SelectItem value="active">{t("statuses.active")}</SelectItem>
            <SelectItem value="suspended">{t("statuses.suspended")}</SelectItem>
            <SelectItem value="unverified">{t("statuses.unverified")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {users.isError ? (
        <ErrorState message={errorMessage(users.error)} onRetry={() => users.refetch()} retryLabel={tc("retry")} />
      ) : users.isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : users.data?.items.length === 0 ? (
        <EmptyState icon={Users} title={t("empty")} />
      ) : (
        <Card className={users.isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminTable head={[t("columns.user"), t("columns.role"), t("columns.status"), t("columns.cards"), t("columns.joined"), <span key="a" className="sr-only">{t("columns.actions")}</span>]}>
            {users.data?.items.map((u) => (
              <tr key={u.id} className="transition hover:bg-muted/40">
                <td className="max-w-xs px-4 py-3">
                  <Link href={`/dashboard/admin/users/${u.id}`} className="block hover:opacity-80"><UserCell user={u} isMe={u.id === me?.id} /></Link>
                </td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3"><UserStatusBadges user={u} /></td>
                <td className="px-4 py-3 tabular-nums">{u.cardsCount ?? 0}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(u.createdAt, locale)}</td>
                <td className="px-4 py-3 text-end"><UserActionsMenu user={u} isMe={u.id === me?.id} /></td>
              </tr>
            ))}
          </AdminTable>
          {users.data && <Pager page={page} total={users.data.total} pageSize={PAGE_SIZE} onChange={setPage} />}
        </Card>
      )}
    </div>
  );
}
