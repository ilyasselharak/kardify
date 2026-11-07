"use client";

import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

/** Validated pair (dataviz validator: CVD ΔE ≥ 30, contrast ≥ 3:1 on white). */
export const SERIES = { views: "#006afe", visitors: "#eb6834" } as const;

/** Views & unique visitors over time: 2px lines, light fill, crosshair tooltip, legend above. */
export function ViewsChart({ data, height = 280 }: { data: SeriesPoint[]; height?: number }) {
  const t = useTranslations("analytics");
  const locale = useLocale();
  const rtl = locale === "ar";
  const series = [
    { key: "views" as const, label: t("views") },
    { key: "visitors" as const, label: t("visitors") },
  ];

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: SERIES[s.key] }} />
            {s.label}
          </li>
        ))}
      </ul>
      <div style={{ height }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[s.key]} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={SERIES[s.key]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="#e5eaf1" />
            <XAxis
              dataKey="date"
              reversed={rtl}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(d: string) => formatDate(d, locale, { month: "short", day: "numeric" })}
            />
            <YAxis
              orientation={rtl ? "right" : "left"}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <Tooltip
              cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lifted" dir={rtl ? "rtl" : "ltr"}>
                    <p className="mb-1 font-medium">{formatDate(String(label), locale, { dateStyle: "medium" })}</p>
                    {series.map((s) => {
                      const p = payload.find((x) => x.dataKey === s.key);
                      return (
                        <p key={s.key} className="flex items-center gap-2 text-muted-foreground">
                          <span className="size-2 rounded-full" style={{ background: SERIES[s.key] }} />
                          {s.label}: <span className="font-semibold text-foreground tabular-nums">{String(p?.value ?? 0)}</span>
                        </p>
                      );
                    })}
                  </div>
                ) : null
              }
            />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={SERIES[s.key]}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
