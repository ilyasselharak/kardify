"use client";

import { hardNavigate } from "@/lib/navigation";
import { Loader2, LogOut, Menu, MailWarning, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import type { User } from "@/lib/api/types";
import { useUpdateProfile } from "@/lib/hooks/use-account";
import { useLogout, useMe } from "@/lib/hooks/use-auth";
import { cn, initials } from "@/lib/utils";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { DASHBOARD_NAV } from "./nav-items";

function useLogoutAction() {
  const logout = useLogout();
  const t = useTranslations("auth");
  const locale = useLocale();
  return {
    pending: logout.isPending,
    run: () =>
      logout.mutate(undefined, {
        onSettled: () => {
          toast.success(t("loggedOut"));
          hardNavigate(`/${locale}/login`);
        },
      }),
  };
}

function SidebarNav({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin?: boolean }) {
  const t = useTranslations("dashboard.nav");
  const ta = useTranslations("admin");
  const pathname = usePathname();
  const logout = useLogoutAction();
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(href + "/") && !(href === "/dashboard/cards" && pathname === "/dashboard/cards/new"));

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {DASHBOARD_NAV.map(({ href, key, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-[18px]" />
            {t(key)}
          </Link>
        );
      })}
      {isAdmin && (
        <>
          <div className="mx-3 my-3 h-px bg-border" />
          <Link
            href="/dashboard/admin"
            onClick={onNavigate}
            aria-current={pathname.startsWith("/dashboard/admin") ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              pathname.startsWith("/dashboard/admin") ? "bg-navy text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShieldCheck className="size-[18px]" />
            {ta("nav")}
          </Link>
        </>
      )}
      <button
        type="button"
        onClick={logout.run}
        disabled={logout.pending}
        className="mt-auto mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="rtl-flip size-[18px]" />
        {t("logout")}
      </button>
    </nav>
  );
}

function UserMenu({ user }: { user: User }) {
  const t = useTranslations("dashboard.nav");
  const ta = useTranslations("admin");
  const logout = useLogoutAction();
  const name = `${user.firstName} ${user.lastName}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <Avatar>
          {user.profileImage && <AvatarImage src={user.profileImage} alt="" />}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-foreground">
          <span className="block text-sm font-semibold">{name}</span>
          <span dir="ltr" className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard/settings/profile">{t("settings")}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard/help">{t("help")}</Link></DropdownMenuItem>
        {user.role === "ADMIN" && <DropdownMenuItem asChild><Link href="/dashboard/admin"><ShieldCheck /> {ta("nav")}</Link></DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={logout.run}>
          <LogOut className="rtl-flip" /> {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Authenticated app shell: sidebar, top bar, auth + verification gate. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useMe();
  const locale = useLocale();
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (!isLoading && user === null) {
      hardNavigate(`/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isLoading, user, locale]);

  if (isLoading || user === null || (isError && !user)) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  if (!user.emailVerified) {
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-5">
          <Logo />
          <LocaleSwitcher />
        </header>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center px-5 py-10">
          <VerifyEmailView />
        </div>
      </div>
    );
  }

  // Persist language changes to the account so emails/redirects use it too.
  const onLocaleChange = (next: "en" | "ar") => updateProfile.mutate({ preferredLanguage: next });

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-e border-border bg-card lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard"><Logo /></Link>
        </div>
        <SidebarNav isAdmin={user.role === "ADMIN"} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-lg sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu"><Menu /></Button>
              </SheetTrigger>
              <SheetContent className="pt-5">
                <SheetTitle className="px-6 pb-6"><Logo /></SheetTitle>
                <SheetClose asChild>
                  <div className="flex flex-1 flex-col"><SidebarNav isAdmin={user.role === "ADMIN"} /></div>
                </SheetClose>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="sm:hidden"><Logo className="[&>span:last-child]:hidden" /></Link>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher onChange={onLocaleChange} />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function VerifyBanner() {
  const t = useTranslations("dashboard");
  return (
    <div className="flex items-center gap-2 bg-warning/15 px-4 py-2 text-sm text-amber-800">
      <MailWarning className="size-4" /> {t("verifyBanner")}
    </div>
  );
}
