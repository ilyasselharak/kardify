"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/lib/api/types";
import { initials } from "@/lib/utils";

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; confirmLabel: string; onConfirm: () => void;
}) {
  const tc = useTranslations("common");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Pager({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-3">
      <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={tc("back")}>
        <ChevronLeft className="rtl-flip" />
      </Button>
      <span className="text-sm text-muted-foreground">{t("pagination", { page, total: pages })}</span>
      <Button variant="outline" size="icon-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={tc("next")}>
        <ChevronRight className="rtl-flip" />
      </Button>
    </div>
  );
}

export function UserCell({ user, isMe }: { user: Pick<AdminUser, "firstName" | "lastName" | "email" | "profileImage">; isMe?: boolean }) {
  const t = useTranslations("admin");
  const name = `${user.firstName} ${user.lastName}`;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        {user.profileImage && <AvatarImage src={user.profileImage} alt="" />}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium" dir="auto">
          {name} {isMe && <Badge variant="outline" className="py-0 text-[10px]">{t("you")}</Badge>}
        </p>
        <p className="truncate text-xs text-muted-foreground"><bdi dir="ltr">{user.email}</bdi></p>
      </div>
    </div>
  );
}

export function UserStatusBadges({ user }: { user: Pick<AdminUser, "role" | "emailVerified" | "suspendedAt"> }) {
  const t = useTranslations("admin");
  return (
    <div className="flex flex-wrap gap-1.5">
      {user.suspendedAt ? (
        <Badge variant="destructive">{t("suspendedBadge")}</Badge>
      ) : user.emailVerified ? (
        <Badge variant="success">{t("verified")}</Badge>
      ) : (
        <Badge variant="warning">{t("unverified")}</Badge>
      )}
    </div>
  );
}

export function RoleBadge({ role }: { role: AdminUser["role"] }) {
  const t = useTranslations("admin.roles");
  return <Badge variant={role === "ADMIN" ? "default" : "muted"}>{t(role)}</Badge>;
}

/** Table wrapper: horizontal scroll on small screens, consistent cell styling. */
export function AdminTable({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-start text-xs font-medium text-muted-foreground">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
