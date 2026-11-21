import { CV_LABELS, formatMonth, formatRange, sectionTitle, splitLines } from "@/lib/cv/labels";
import { sectionHasContent } from "@/lib/cv/document";
import type { CvTemplateDef } from "@/lib/cv/templates";
import { SECTION_EXTRA_KIND, type CvDesign, type CvDocument, type CvSectionKey, type CvSkill } from "@/lib/cv/types";
import { displayUrl } from "@/lib/cv/labels";
import { ContactList, CvHeader, CvLink, EntryHeader, SectionTitle, TextLine, type RenderCtx } from "./cv-parts";

export interface CvBlock {
  key: string;
  node: React.ReactNode;
  /** Must stay on the same page as the following block. */
  keepWithNext?: boolean;
  /** Space below the block, in px (scaled by the spacing setting). */
  gap: number;
}

export interface CvBlocks {
  header: React.ReactNode | null;
  main: CvBlock[];
  side: CvBlock[];
}

const GAP = { title: 7, header: 2.5, line: 1.5, item: 9, section: 15 } as const;

/** Splits a CV into small blocks that the paginator can distribute across A4 pages. */
export function buildCvBlocks(doc: CvDocument, tpl: CvTemplateDef, design: CvDesign, links = true): CvBlocks {
  const lang = doc.language;
  const ctx: RenderCtx = { doc, tpl, design, lang, labels: CV_LABELS[lang], links };
  const L = CV_LABELS[lang];
  const sideKeys = new Set(tpl.sidebar?.sections ?? []);
  const main: CvBlock[] = [];
  const side: CvBlock[] = [];
  const sideContact = !!tpl.sidebar?.contact;

  const header = <CvHeader ctx={ctx} sideContact={sideContact} />;
  if (tpl.headerPlacement === "main") main.push({ key: "header", node: header, gap: 0 });
  if (tpl.headerPlacement === "side") side.push({ key: "header", node: header, gap: 0 });

  if (sideContact) {
    const list = <ContactList ctx={ctx} className="text-[0.9em]" />;
    side.push({ key: "contact-title", node: <SectionTitle ctx={ctx} text={L.contact} side />, keepWithNext: true, gap: GAP.title });
    side.push({ key: "contact", node: list, gap: GAP.section });
  }

  for (const section of doc.sections) {
    if (!sectionHasContent(doc, section.key)) continue;
    const inSide = sideKeys.has(section.key) && !!tpl.sidebar;
    const target = inSide ? side : main;
    const blocks = sectionBlocks(ctx, section.key, inSide);
    if (!blocks.length) continue;
    target.push({
      key: `${section.key}-title`,
      node: <SectionTitle ctx={ctx} text={sectionTitle(lang, section.key, section.title)} side={inSide} />,
      keepWithNext: true,
      gap: GAP.title,
    });
    blocks[blocks.length - 1].gap = GAP.section;
    target.push(...blocks);
  }

  return { header: tpl.headerPlacement === "full" ? header : null, main, side };
}

function lines(ctx: RenderCtx, key: string, text: string, side: boolean, label?: string): CvBlock[] {
  const parts = splitLines(text);
  return parts.map((p, i) => ({
    key: `${key}-l${i}`,
    node: <TextLine ctx={ctx} text={p.text} bullet={p.bullet} side={side} label={i === 0 ? label : undefined} />,
    gap: GAP.line,
  }));
}

/** An entry = header block (kept with its first line) + one block per line. */
function entry(key: string, headerNode: React.ReactNode, body: CvBlock[]): CvBlock[] {
  const out: CvBlock[] = [{ key: `${key}-h`, node: headerNode, keepWithNext: body.length > 0, gap: body.length ? GAP.header : GAP.item }, ...body];
  out[out.length - 1].gap = GAP.item;
  return out;
}

function sectionBlocks(ctx: RenderCtx, key: CvSectionKey, side: boolean): CvBlock[] {
  const { doc, design, lang } = ctx;
  const L = CV_LABELS[lang];
  const fmt = design.dateFormat;

  switch (key) {
    case "summary": {
      const out = [...lines(ctx, "sum", doc.profile.summary, side)];
      if (doc.profile.objectives) out.push(...lines(ctx, "obj", doc.profile.objectives, side, L.objectives));
      if (doc.profile.achievements) {
        out.push({ key: "ach-t", node: <TextLine ctx={ctx} text={L.achievements} side={side} strong />, keepWithNext: true, gap: GAP.line });
        out.push(...lines(ctx, "ach", doc.profile.achievements, side));
      }
      if (out.length) out[out.length - 1].gap = GAP.item;
      return out;
    }

    case "experience":
      return doc.experiences.flatMap((e, i) => {
        const meta = [e.location, e.employmentType ? L.employment[e.employmentType as keyof typeof L.employment] : null].filter(Boolean).join(" · ");
        const body = lines(ctx, `exp${i}`, e.responsibilities, side);
        if (e.achievements.trim()) {
          const ach = lines(ctx, `exp${i}a`, e.achievements, side);
          if (ach.length) {
            body.push({ key: `exp${i}-at`, node: <TextLine ctx={ctx} text={L.keyAchievements} side={side} />, keepWithNext: true, gap: GAP.line });
            body.push(...ach);
          }
        }
        return entry(`exp${i}`, <EntryHeader ctx={ctx} side={side} title={e.jobTitle} org={e.company} meta={meta} dates={formatRange(e.startDate, e.endDate, e.current, lang, fmt)} />, body);
      });

    case "education":
      return doc.educations.flatMap((e, i) => {
        const meta = [e.location, e.grade ? `${L.grade}: ${e.grade}` : null].filter(Boolean).join(" · ");
        return entry(`edu${i}`, <EntryHeader ctx={ctx} side={side} title={e.degree} org={e.institution} meta={meta} dates={formatRange(e.startDate, e.endDate, false, lang, fmt)} />, lines(ctx, `edu${i}`, e.description, side));
      });

    case "projects":
      return doc.projects.flatMap((p, i) => {
        const links = [p.url && { href: p.url, text: displayUrl(p.url) }, p.githubUrl && { href: p.githubUrl, text: displayUrl(p.githubUrl) }].filter(Boolean) as { href: string; text: string }[];
        const body = lines(ctx, `prj${i}`, p.description, side);
        if (p.technologies.trim()) body.push({ key: `prj${i}-tech`, node: <TextLine ctx={ctx} text={p.technologies} side={side} label={L.technologies} />, gap: GAP.line });
        const title = (
          <span className="inline-flex items-center gap-[0.6em]">
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt="" className="h-[9mm] w-[13mm] shrink-0 rounded-[3px] object-cover" />
            )}
            {p.name}
          </span>
        );
        return entry(`prj${i}`, <EntryHeader ctx={ctx} side={side} title={title} dates={formatRange(p.startDate, p.endDate, false, lang, fmt)} link={links} />, body);
      });

    case "certifications":
      return doc.certifications.map((c, i) => {
        const exp = c.expirationDate ? `${L.expires} ${formatMonth(c.expirationDate, lang, fmt)}` : undefined;
        return {
          key: `cert${i}`,
          node: (
            <EntryHeader
              ctx={ctx}
              side={side}
              title={c.credentialUrl ? <CvLink ctx={ctx} href={c.credentialUrl}>{c.name}</CvLink> : c.name}
              org={c.issuer}
              meta={side ? [formatMonth(c.issueDate, lang, fmt), exp].filter(Boolean).join(" · ") : exp}
              dates={side ? undefined : formatMonth(c.issueDate, lang, fmt)}
            />
          ),
          gap: GAP.item,
        };
      });

    case "skills":
      return skillBlocks(ctx, side);

    case "languages":
      return [{
        key: "langs",
        node: (
          <div className="grid gap-[0.45em]">
            {doc.languages.map((l, i) => (
              <div key={i} className="grid gap-[0.2em]">
                <div className="flex items-baseline justify-between gap-[0.8em]">
                  <span dir="auto" className="font-medium">{l.language}</span>
                  <span className="text-[0.88em] opacity-80">{L.levels[l.proficiency]}</span>
                </div>
                {design.skillStyle === "bars" && <LevelBar level={{ native: 5, fluent: 5, advanced: 4, intermediate: 3, basic: 2 }[l.proficiency]} side={side} />}
              </div>
            ))}
          </div>
        ),
        gap: GAP.item,
      }];

    default: {
      const kind = SECTION_EXTRA_KIND[key];
      const items = doc.extras.filter((x) => x.kind === kind);
      if (key === "interests") {
        return [{ key: "interests", node: <Tags names={items.map((x) => x.title)} side={side} />, gap: GAP.item }];
      }
      return items.flatMap((x, i) =>
        entry(
          `${key}${i}`,
          <EntryHeader
            ctx={ctx}
            side={side}
            title={x.url ? <CvLink ctx={ctx} href={x.url}>{x.title}</CvLink> : x.title}
            org={x.subtitle ?? undefined}
            dates={x.date ?? undefined}
          />,
          lines(ctx, `${key}${i}`, x.description, side),
        ),
      );
    }
  }
}

function LevelBar({ level, side }: { level: number; side: boolean }) {
  return (
    <div className="flex gap-[3px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="h-[4px] flex-1 rounded-full"
          style={{ background: n <= level ? (side ? "currentColor" : "var(--cv-accent)") : side ? "color-mix(in srgb, currentColor 25%, transparent)" : "color-mix(in srgb, var(--cv-accent) 18%, transparent)" }}
        />
      ))}
    </div>
  );
}

function Tags({ names, side }: { names: string[]; side: boolean }) {
  return (
    <div className="flex flex-wrap gap-[0.4em]">
      {names.map((n, i) => (
        <span
          key={i}
          dir="auto"
          className="rounded-[0.4em] px-[0.6em] py-[0.18em] text-[0.9em]"
          style={side ? { background: "color-mix(in srgb, currentColor 14%, transparent)" } : { background: "color-mix(in srgb, var(--cv-accent) 10%, transparent)", color: "var(--cv-accent)" }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function skillBlocks(ctx: RenderCtx, side: boolean): CvBlock[] {
  const { doc, design } = ctx;
  const L = CV_LABELS[ctx.lang];
  const groups = new Map<CvSkill["category"], CvSkill[]>();
  for (const s of doc.skills) groups.set(s.category, [...(groups.get(s.category) ?? []), s]);
  const labelled = groups.size > 1;

  return [...groups.entries()].map(([cat, skills]) => {
    const label = labelled ? <p className="mb-[0.3em] text-[0.88em] font-semibold opacity-85">{L.skillCategories[cat]}</p> : null;
    let body: React.ReactNode;
    if (design.skillStyle === "bars") {
      body = (
        <div className={side ? "grid gap-[0.45em]" : "grid grid-cols-2 gap-x-[1.6em] gap-y-[0.45em]"}>
          {skills.map((s, i) => (
            <div key={i} className="grid gap-[0.2em]">
              <span dir="auto" className="text-[0.95em]">{s.name}</span>
              {s.level ? <LevelBar level={s.level} side={side} /> : null}
            </div>
          ))}
        </div>
      );
    } else if (design.skillStyle === "list") {
      body = <p dir="auto" className="leading-[1.5]">{skills.map((s) => s.name).join(" · ")}</p>;
    } else {
      body = <Tags names={skills.map((s) => s.name)} side={side} />;
    }
    return { key: `skills-${cat}`, node: <div>{label}{body}</div>, gap: GAP.item };
  });
}
