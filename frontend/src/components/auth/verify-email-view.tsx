"use client";

import { hardNavigate } from "@/lib/navigation";
import { CheckCircle2, Loader2, MailWarning, Mail, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useLogout, useMe, useResendVerification, useVerifyEmail } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { StatusPanel } from "./status-panel";

/** Handles both "check your inbox" (no token) and the confirmation link (token present). */
export function VerifyEmailView() {
  const params = useSearchParams();
  const token = params.get("token");
  const type = params.get("type") ?? undefined;
  return token ? <ConfirmToken token={token} type={type} /> : <PendingVerification />;
}

function ConfirmToken({ token, type }: { token: string; type?: string }) {
  const t = useTranslations("auth.verify");
  const tl = useTranslations("auth.login");
  const verify = useVerifyEmail();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verify.mutate({ token, type });
  }, [token, type, verify]);

  if (verify.isError) {
    return (
      <StatusPanel icon={XCircle} tone="destructive" title={t("failureTitle")} body={t("failureBody")}>
        <ResendButton />
        <Button asChild variant="ghost"><Link href="/login">{tl("submit")}</Link></Button>
      </StatusPanel>
    );
  }
  if (verify.isSuccess) {
    const changed = type === "email-change";
    return (
      <StatusPanel
        icon={CheckCircle2}
        tone="success"
        title={changed ? t("emailChangedTitle") : t("successTitle")}
        body={changed ? t("emailChangedBody") : t("successBody")}
      >
        <Button asChild size="lg"><Link href="/dashboard">{t("continue")}</Link></Button>
      </StatusPanel>
    );
  }
  return <StatusPanel icon={Loader2} title={t("verifying")} />;
}

function ResendButton({ email }: { email?: string }) {
  const t = useTranslations("auth.verify");
  const resend = useResendVerification();
  const errorMessage = useErrorMessage();
  return (
    <Button
      variant="outline"
      loading={resend.isPending}
      onClick={() =>
        resend.mutate(email, {
          onSuccess: () => toast.success(t("resent")),
          onError: (e) => toast.error(errorMessage(e)),
        })
      }
    >
      <Mail /> {t("resend")}
    </Button>
  );
}

function PendingVerification() {
  const t = useTranslations("auth.verify");
  const { data: user, isLoading } = useMe();
  const logout = useLogout();

  if (isLoading) return <StatusPanel icon={Loader2} title={t("verifying")} />;
  if (user?.emailVerified) {
    return (
      <StatusPanel icon={CheckCircle2} tone="success" title={t("successTitle")} body={t("successBody")}>
        <Button asChild size="lg"><Link href="/dashboard">{t("continue")}</Link></Button>
      </StatusPanel>
    );
  }
  return (
    <StatusPanel
      icon={MailWarning}
      title={t("pendingTitle")}
      body={
        <>
          {t("pendingBody", { email: user?.email ?? "" })}
          <span className="mt-2 block text-sm">{t("pendingHint")}</span>
        </>
      }
    >
      <ResendButton email={user?.email} />
      {user && (
        <Button variant="ghost" loading={logout.isPending} onClick={() => logout.mutate(undefined, { onSettled: () => hardNavigate("/login") })}>
          {t("logout")}
        </Button>
      )}
    </StatusPanel>
  );
}
