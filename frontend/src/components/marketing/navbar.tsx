"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { useMe } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const { data: user } = useMe();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#features", label: t("features") },
    { href: "/#how-it-works", label: t("howItWorks") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className={cn("sticky top-0 z-40 transition-all", scrolled ? "border-b border-border bg-white/80 backdrop-blur-lg" : "bg-transparent")}>
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Kardify">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          {user ? (
            <Button asChild size="sm"><Link href="/dashboard">{t("dashboard")}</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/login">{t("login")}</Link></Button>
              <Button asChild size="sm"><Link href="/register">{t("signup")}</Link></Button>
            </>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("openMenu")}>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-6">
            <SheetTitle className="sr-only">Kardify</SheetTitle>
            <Logo />
            <ul className="mt-8 grid gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-muted">{l.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto grid gap-2">
              <LocaleSwitcher variant="outline" />
              {user ? (
                <Button asChild><Link href="/dashboard">{t("dashboard")}</Link></Button>
              ) : (
                <>
                  <Button asChild variant="outline"><Link href="/login">{t("login")}</Link></Button>
                  <Button asChild><Link href="/register">{t("signup")}</Link></Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
