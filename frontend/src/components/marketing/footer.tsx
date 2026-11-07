import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const cols = [
    { title: t("product"), links: [{ href: "/#features", label: nav("features") }, { href: "/#faq", label: nav("faq") }] },
    { title: t("company"), links: [{ href: "/about", label: nav("about") }, { href: "/contact", label: nav("contact") }] },
    { title: t("legal"), links: [{ href: "/terms", label: t("terms") }, { href: "/privacy", label: t("privacy") }] },
  ];
  return (
    <footer className="border-t border-border bg-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold">{c.title}</h3>
            <ul className="mt-4 grid gap-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-foreground">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page py-6 text-xs text-muted-foreground">
          <FooterYear render={(year) => t("rights", { year })} />
        </div>
      </div>
    </footer>
  );
}

/** Static year avoids `new Date()` during prerender (disallowed under Cache Components). */
function FooterYear({ render }: { render: (year: number) => string }) {
  return <>{render(2026)}</>;
}
