"use client";

import { BadgeCheck, Eye, LogOut, MoreHorizontal, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import type { AdminUser } from "@/lib/api/types";
import {
  useAdminDeleteUser, useAdminRevokeSessions, useAdminSuspendUser, useAdminUpdateUser,
} from "@/lib/hooks/use-admin";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { ConfirmDialog } from "./admin-ui";

/** Shared admin actions for a user (used in the table and on the detail page). */
export function useUserAdminActions(user: AdminUser, onDeleted?: () => void) {
  const t = useTranslations("admin");
  const errorMessage = useErrorMessage();
  const update = useAdminUpdateUser();
  const suspend = useAdminSuspendUser();
  const revoke = useAdminRevokeSessions();
  const remove = useAdminDeleteUser();
  const onError = (e: unknown) => toast.error(errorMessage(e));
  return {
    pending: update.isPending || suspend.isPending || revoke.isPending || remove.isPending,
    verify: () => update.mutate({ id: user.id, data: { emailVerified: true } }, { onSuccess: () => toast.success(t("toasts.updated")), onError }),
    setRole: (role: AdminUser["role"]) => update.mutate({ id: user.id, data: { role } }, { onSuccess: () => toast.success(t("toasts.updated")), onError }),
    setSuspended: (value: boolean) =>
      suspend.mutate({ id: user.id, suspend: value }, { onSuccess: () => toast.success(t(value ? "toasts.suspended" : "toasts.unsuspended")), onError }),
    revokeSessions: () => revoke.mutate(user.id, { onSuccess: () => toast.success(t("toasts.sessionsRevoked")), onError }),
    remove: () =>
      remove.mutate(user.id, {
        onSuccess: () => {
          toast.success(t("toasts.deleted"));
          onDeleted?.();
        },
        onError,
      }),
  };
}

export function UserActionsMenu({ user, isMe }: { user: AdminUser; isMe: boolean }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const a = useUserAdminActions(user);
  const [confirm, setConfirm] = useState<"suspend" | "delete" | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("actions.menu")} disabled={a.pending}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => router.push(`/dashboard/admin/users/${user.id}`)}><Eye /> {t("actions.view")}</DropdownMenuItem>
          {!user.emailVerified && <DropdownMenuItem onSelect={a.verify}><BadgeCheck /> {t("actions.verify")}</DropdownMenuItem>}
          {!isMe && (
            <>
              {user.role === "ADMIN" ? (
                <DropdownMenuItem onSelect={() => a.setRole("USER")}><ShieldOff /> {t("actions.removeAdmin")}</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => a.setRole("ADMIN")}><ShieldCheck /> {t("actions.makeAdmin")}</DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={a.revokeSessions}><LogOut className="rtl-flip" /> {t("actions.revokeSessions")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.suspendedAt ? (
                <DropdownMenuItem onSelect={() => a.setSuspended(false)}><UserCheck /> {t("actions.unsuspend")}</DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("suspend")}><UserX /> {t("actions.suspend")}</DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}><Trash2 /> {t("actions.delete")}</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirm === "suspend"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("confirm.suspendTitle")}
        description={t("confirm.suspendBody", { email: user.email })}
        confirmLabel={t("actions.suspend")}
        onConfirm={() => a.setSuspended(true)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("confirm.deleteUserTitle")}
        description={t("confirm.deleteUserBody", { email: user.email })}
        confirmLabel={t("actions.delete")}
        onConfirm={a.remove}
      />
    </>
  );
}
