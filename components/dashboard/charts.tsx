"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_COLORS, CHART_COLORS } from "@/lib/chart-colors";
import type { MonthPoint } from "@/lib/finance/dashboard";
import { formatAZN } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";
import type { Translate } from "@/lib/i18n/translate";

const LABELS: Record<string, string> = {
  income: "Gəlir",
  expenses: "Xərc",
  forecast: "Plan proqnozu",
  actual: "Faktiki gəlir",
};

const axisTick = { fill: CHART_COLORS.axis, fontSize: 12 };
const tooltipStyle = {
  borderRadius: 14,
  borderColor: CHART_COLORS.grid,
  fontSize: 13,
  boxShadow: "0 10px 30px -14px rgb(70 55 140 / 0.3)",
};

function compact(value: number) {
  return Math.abs(value) >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value);
}

// Legend entries follow this fixed order instead of Recharts' alphabetical default.
const SERIES_ORDER = ["income", "expenses", "actual", "forecast"];
function seriesOrder(item: { dataKey?: unknown }) {
  return SERIES_ORDER.indexOf(String(item.dataKey));
}

function legendLabel(t: Translate) {
  return function LegendLabel(value: unknown) {
    return <span className="text-sm text-foreground">{t(LABELS[String(value)] ?? String(value))}</span>;
  };
}

function tooltipValue(t: Translate) {
  return (value: unknown, name: unknown): [string, string] => [
    formatAZN(Number(value)),
    t(LABELS[String(name)] ?? String(name)),
  ];
}

export function EmptyChart({ text }: { text?: string }) {
  const t = useT();
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      {text ?? t("Göstərmək üçün məlumat yoxdur.")}
    </div>
  );
}

export function MonthlyBarChart({ data }: { data: MonthPoint[] }) {
  const t = useT();
  if (!data.some((point) => point.income || point.expenses)) return <EmptyChart />;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4} barCategoryGap="24%">
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={compact} tick={axisTick} tickLine={false} axisLine={false} width={44} />
          <Tooltip formatter={tooltipValue(t)} contentStyle={tooltipStyle} cursor={{ fill: "#f4f3f9" }} />
          <Legend verticalAlign="top" align="left" height={36} formatter={legendLabel(t)} iconType="circle" iconSize={8} itemSorter={seriesOrder} />
          <Bar dataKey="income" fill={CHART_COLORS.revenue} radius={[8, 8, 3, 3]} maxBarSize={30} />
          <Bar dataKey="expenses" fill={CHART_COLORS.costs} radius={[8, 8, 3, 3]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface CategorySlice {
  category: string;
  amount: number;
  share_pct: number;
  color: string;
}

// Folds everything beyond the palette into "Digər" so no colour is ever generated or reused.
export function toCategorySlices(
  categories: { category: string; amount: number; share_pct: number }[],
  colorOf: (category: string) => string | undefined,
  t: Translate,
): CategorySlice[] {
  const slices: CategorySlice[] = [];
  let otherAmount = 0;
  let otherShare = 0;
  for (const item of categories) {
    const color = colorOf(item.category);
    if (color) slices.push({ ...item, color });
    else {
      otherAmount += item.amount;
      otherShare += item.share_pct;
    }
  }
  if (otherAmount > 0) {
    slices.push({ category: t("Digər"), amount: otherAmount, share_pct: Math.round(otherShare * 10) / 10, color: CHART_COLORS.other });
  }
  return slices;
}

// Stable colour per category name: slots are handed out in alphabetical order of all categories.
export function categoryColorMap(allCategories: string[]) {
  const sorted = [...new Set(allCategories)].sort((a, b) => a.localeCompare(b, "az"));
  return (category: string) => {
    const index = sorted.indexOf(category);
    return index >= 0 && index < CATEGORY_COLORS.length ? CATEGORY_COLORS[index] : undefined;
  };
}

// Expense breakdown as labelled share bars: each category shows its name, amount and share.
export function ExpenseBars({ slices }: { slices: CategorySlice[] }) {
  const t = useT();
  if (!slices.length) return <EmptyChart text={t("Bu ay hələ xərc yoxdur.")} />;

  return (
    <ul className="space-y-5">
      {slices.map((slice) => (
        <li key={slice.category} className="space-y-1.5">
          <p className="truncate text-sm font-medium">{slice.category}</p>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${slice.category}: ${slice.share_pct}%`}
          >
            <div
              className="bar-stripes h-full rounded-full"
              style={{ width: `${Math.max(slice.share_pct, 2)}%`, color: slice.color }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="tabular-nums text-muted-foreground">{formatAZN(slice.amount)}</span>
            <span className="font-semibold tabular-nums">{slice.share_pct}%</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export interface ForecastPoint {
  label: string;
  forecast: number;
  actual: number | null;
}

export function ForecastLineChart({ data }: { data: ForecastPoint[] }) {
  const t = useT();
  if (!data.length) return <EmptyChart text={t("Bu biznes üçün plan proqnozu yoxdur.")} />;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={compact} tick={axisTick} tickLine={false} axisLine={false} width={44} />
          <Tooltip formatter={tooltipValue(t)} contentStyle={tooltipStyle} />
          <Legend verticalAlign="top" align="left" height={36} formatter={legendLabel(t)} iconType="plainline" itemSorter={seriesOrder} />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={CHART_COLORS.costs}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={CHART_COLORS.revenue}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.revenue }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
