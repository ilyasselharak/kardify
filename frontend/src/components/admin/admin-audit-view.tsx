"use client";

import { ScrollText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAuditLog } from "@/lib/hooks/use-admin";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatDate } from "@/lib/utils";
import { AdminTable, Pager } from "./admin-ui";

const PAGE_SIZE = 25;

/** Renders the small `meta` object as readable key/value text (e.g. "role: USER → ADMIN"). */
function describeMeta(meta: Record<string, unknown>) {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(meta)) {
    if (k === "changes" && v && typeof v === "object") {
      for (const [field, change] of Object.entries(v as Record<string, { from: unknown; to: unknown }>)) {
        parts.push(`${field}: ${String(change.from)} → ${String(change.to)}`);
      }
    } else if (k !== "owner") {
      parts.push(`${k}: ${String(v)}`);
    }
  }
  return parts.join(" · ");
}

export function AdminAuditView() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const [page, setPage] = useState(1);
  const log = useAuditLog({ page, pageSize: PAGE_SIZE });

  if (log.isError) return <ErrorState message={errorMessage(log.error)} onRetry={() => log.refetch()} retryLabel={tc("retry")} />;
  if (log.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!log.data?.items.length) return <EmptyState icon={ScrollText} title={t("empty")} />;

  return (
    <Card>
      <AdminTable head={[t("columns.when"), t("columns.admin"), t("columns.action"), t("columns.details")]}>
        {log.data.items.map((e) => (
          <tr key={e.id} className="align-top">
            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(e.createdAt, locale, { dateStyle: "medium", timeStyle: "short" })}</td>
            <td className="px-4 py-3"><bdi dir="ltr">{e.adminEmail}</bdi></td>
            <td className="px-4 py-3">
              <Badge variant={e.action.endsWith("delete") || e.action.endsWith("suspend") ? "destructive" : "outline"}>
                {(() => {
                  const key = `auditActions.${e.action.replace(/\./g, "_")}`;
                  return t.has(key as "auditActions.user_update") ? t(key as "auditActions.user_update") : e.action;
                })()}
              </Badge>
            </td>
            <td className="max-w-md px-4 py-3 text-xs text-muted-foreground">
              {e.targetType === "user" && e.targetId && e.action !== "user.delete" ? (
                <Link href={`/dashboard/admin/users/${e.targetId}`} className="hover:text-primary"><bdi dir="ltr">{describeMeta(e.meta)}</bdi></Link>
              ) : (
                <bdi dir="ltr">{describeMeta(e.meta)}</bdi>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
      <Pager page={page} total={log.data.total} pageSize={PAGE_SIZE} onChange={setPage} />
    </Card>
  );
}
