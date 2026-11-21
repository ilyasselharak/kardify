"use client";

import { ArrowLeft, Building2, CreditCard, ExternalLink, Eye, Globe, Mail, MapPin, Phone, Search, UserRound, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BusinessCardFront, FlippableCard } from "@/components/cards/business-card";
import { SocialIcon } from "@/components/cards/social-icons";
import { StatusBadge } from "@/components/cards/status-badge";
import { EmptyState, ErrorState } from "@/components/dashboard/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { useAdminCompany, type AdminCompanyCard, type AdminCompanyDetail } from "@/lib/hooks/use-admin";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatDate, formatNumber, initials } from "@/lib/utils";
import { CardAdminActions } from "./card-admin-actions";

type Person = AdminCompanyDetail["people"][number];

/** Full card: front/back flip and every detail on it. */
function CardDialog({ card, person, onClose }: { card: AdminCompanyCard | null; person?: Person; onClose: () => void }) {
  const t = useTranslations("admin.company");
  const locale = useLocale();
  const [side, setSide] = useState<"front" | "back">("front");
  if (!card) return null;
  const rows = [
    card.jobTitle && { icon: UserRound, label: t("fields.jobTitle"), value: card.jobTitle },
    card.email && { icon: Mail, label: t("fields.email"), value: card.email, href: `mailto:${card.email}`, ltr: true },
    card.phone && { icon: Phone, label: t("fields.phone"), value: card.phone, href: `tel:${card.phone}`, ltr: true },
    card.whatsapp && { icon: Phone, label: "WhatsApp", value: card.whatsapp, ltr: true },
    card.website && { icon: Globe, label: t("fields.website"), value: card.website.replace(/^https?:\/\//, ""), href: card.website, ltr: true },
    card.address && { icon: MapPin, label: t("fields.address"), value: card.address },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string; ltr?: boolean }[];
  const socials = card.socialLinks.filter((l) => l.visible !== false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pe-8"><bdi>{card.name}</bdi></DialogTitle>
          <DialogDescription>
            {person && <bdi dir="ltr">{person.user.email}</bdi>} · {t("updated", { date: formatDate(card.updatedAt, locale) })}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-[radial-gradient(circle_at_top,#eaf2ff,transparent_70%)] px-4 py-6">
          <FlippableCard card={card} url={card.publicUrl} side={side} className="mx-auto max-w-[460px]" />
          <div className="mt-4 flex justify-center">
            <Tabs value={side} onValueChange={(v) => setSide(v as typeof side)}>
              <TabsList className="h-9">
                <TabsTrigger value="front" className="px-4 text-xs">{t("front")}</TabsTrigger>
                <TabsTrigger value="back" className="px-4 text-xs">{t("back")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={card.status} />
          <Badge variant="muted"><Eye className="size-3" /> {t("views", { count: card.views })}</Badge>
          <span className="ms-auto flex items-center gap-1">
            {card.status === "ACTIVE" && (
              <Button asChild size="sm" variant="outline"><a href={card.publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> {t("openPublic")}</a></Button>
            )}
            <CardAdminActions card={card} />
          </span>
        </div>
        {rows.length > 0 && (
          <dl className="grid gap-2 rounded-xl border border-border p-4 sm:grid-cols-2">
            {rows.map(({ icon: Icon, label, value, href, ltr }) => (
              <div key={label} className="flex min-w-0 items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="truncate text-sm font-medium" dir={ltr ? "ltr" : "auto"}>
                    {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{value}</a> : value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        )}
        {card.description && <p dir="auto" className="text-sm text-muted-foreground">{card.description}</p>}
        {socials.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {socials.map((l, i) => (
              <Button key={i} asChild size="sm" variant="outline">
                <a href={l.url} target="_blank" rel="noopener noreferrer"><SocialIcon platform={l.platform} className="size-4" /> {l.label || l.platform}</a>
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PersonRow({ person, onOpen }: { person: Person; onOpen: (card: AdminCompanyCard) => void }) {
  const t = useTranslations("admin.company");
  const locale = useLocale();
  const { user, cards } = person;
  const name = `${user.firstName} ${user.lastName}`;
  const main = cards[0];
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar className="size-12">
          {(user.profileImage || main?.profileImage) && <AvatarImage src={(user.profileImage || main?.profileImage)!} alt="" />}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 dir="auto" className="truncate text-base font-semibold text-navy">{name}</h3>
            {user.suspendedAt && <Badge variant="destructive">{t("suspended")}</Badge>}
            {!user.emailVerified && <Badge variant="warning">{t("unverified")}</Badge>}
          </div>
          {main?.jobTitle && <p dir="auto" className="text-sm text-primary">{main.jobTitle}</p>}
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <a href={`mailto:${user.email}`} className="inline-flex items-center gap-1.5 hover:text-primary"><Mail className="size-3.5" /> <bdi dir="ltr">{user.email}</bdi></a>
            {main?.phone && <a href={`tel:${main.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary"><Phone className="size-3.5" /> <bdi dir="ltr">{main.phone}</bdi></a>}
            <span>{t("joined", { date: formatDate(user.createdAt, locale) })}</span>
          </div>
        </div>
        <Button asChild size="sm" variant="ghost"><Link href={`/dashboard/admin/users/${user.id}`}><UserRound /> {t("account")}</Link></Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <button key={card.id} type="button" onClick={() => onOpen(card)} className="group grid gap-2 rounded-xl p-1.5 text-start transition hover:bg-muted" aria-label={t("openCard", { name: card.name })}>
            <BusinessCardFront card={card} className="pointer-events-none shadow-sm transition group-hover:shadow-lifted" />
            <span className="flex items-center justify-between gap-2 px-1 text-xs">
              <span dir="auto" className="truncate font-medium">{card.name}</span>
              <StatusBadge status={card.status} />
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/** One company: its employees (people holding a card from it) and their business cards. */
export function AdminCompanyView() {
  const t = useTranslations("admin.company");
  const tc = useTranslations("common");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const name = useSearchParams().get("name") ?? "";
  const company = useAdminCompany(name);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<{ card: AdminCompanyCard; person: Person } | null>(null);

  const people = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = company.data?.people ?? [];
    if (!q) return all;
    return all.filter(({ user, cards }) =>
      [user.firstName, user.lastName, user.email, ...cards.flatMap((c) => [c.name, c.jobTitle ?? "", c.phone ?? ""])].some((v) => v.toLowerCase().includes(q)),
    );
  }, [company.data, search]);

  const back = (
    <Button asChild variant="ghost" size="sm" className="justify-self-start">
      <Link href="/dashboard/admin/companies"><ArrowLeft className="rtl-flip" /> {t("allCompanies")}</Link>
    </Button>
  );

  if (company.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (company.isError || !company.data) {
    return <div className="grid gap-4">{back}<ErrorState message={errorMessage(company.error)} onRetry={() => company.refetch()} retryLabel={tc("retry")} /></div>;
  }
  const d = company.data;

  return (
    <div className="grid gap-5">
      <title>{`${d.name} · Kardify`}</title>
      {back}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="size-7" /></span>
        <div className="min-w-0 flex-1">
          <h2 dir="auto" className="truncate text-2xl font-bold text-navy">{d.name}</h2>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> {t("employees", { count: d.totals.people })}</span>
            <span className="inline-flex items-center gap-1.5"><CreditCard className="size-4" /> {t("cards", { count: d.totals.cards })}</span>
            <span>{t("published", { count: formatNumber(d.totals.activeCards, locale) })}</span>
          </div>
        </div>
        <Button asChild variant="outline"><Link href={`/dashboard/admin/cards?company=${encodeURIComponent(d.name)}`}><CreditCard /> {t("manageCards")}</Link></Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" className="ps-9" placeholder={t("search")} aria-label={tc("search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {people.length === 0 ? (
        <EmptyState icon={Users} title={t("noResults")} />
      ) : (
        <div className="grid gap-4">
          {people.map((p) => <PersonRow key={p.user.id} person={p} onOpen={(card) => setOpen({ card, person: p })} />)}
        </div>
      )}

      <CardDialog key={open?.card.id} card={open?.card ?? null} person={open?.person} onClose={() => setOpen(null)} />
    </div>
  );
}
