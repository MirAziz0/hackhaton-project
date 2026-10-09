"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_COLORS, CHART_COLORS } from "@/lib/chart-colors";
import type { MonthPoint } from "@/lib/finance/dashboard";
import { formatAZN } from "@/lib/utils";

const LABELS: Record<string, string> = {
  income: "Gəlir",
  expenses: "Xərc",
  forecast: "Plan proqnozu",
  actual: "Faktiki gəlir",
};

const axisTick = { fill: CHART_COLORS.axis, fontSize: 12 };
const tooltipStyle = { borderRadius: 8, borderColor: CHART_COLORS.grid, fontSize: 13 };

function compact(value: number) {
  return Math.abs(value) >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value);
}

function legendLabel(value: unknown) {
  return <span className="text-sm text-foreground">{LABELS[String(value)] ?? String(value)}</span>;
}

function tooltipValue(value: unknown, name: unknown): [string, string] {
  return [formatAZN(Number(value)), LABELS[String(name)] ?? String(name)];
}

export function EmptyChart({ text = "Göstərmək üçün məlumat yoxdur." }: { text?: string }) {
  return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{text}</div>;
}

export function MonthlyBarChart({ data }: { data: MonthPoint[] }) {
  if (!data.some((point) => point.income || point.expenses)) return <EmptyChart />;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
          <YAxis tickFormatter={compact} tick={axisTick} tickLine={false} axisLine={false} width={44} />
          <Tooltip formatter={tooltipValue} contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
          <Legend formatter={legendLabel} iconType="circle" iconSize={8} />
          <Bar dataKey="income" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" fill={CHART_COLORS.costs} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface DonutSlice {
  category: string;
  amount: number;
  share_pct: number;
  color: string;
}

// Folds everything beyond the palette into "Digər" so no colour is ever generated or reused.
export function toDonutSlices(
  categories: { category: string; amount: number; share_pct: number }[],
  colorOf: (category: string) => string | undefined,
): DonutSlice[] {
  const slices: DonutSlice[] = [];
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
    slices.push({ category: "Digər", amount: otherAmount, share_pct: Math.round(otherShare * 10) / 10, color: CHART_COLORS.other });
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

export function ExpenseDonut({ slices, total }: { slices: DonutSlice[]; total: number }) {
  if (!slices.length) return <EmptyChart text="Bu ay hələ xərc yoxdur." />;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, name) => [formatAZN(Number(value)), String(name)]}
              contentStyle={tooltipStyle}
            />
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="category"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.category} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Cəmi</span>
          <span className="text-base font-semibold tabular-nums">{formatAZN(total)}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.category} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="min-w-0 flex-1 truncate">{slice.category}</span>
            <span className="tabular-nums text-muted-foreground">{slice.share_pct}%</span>
            <span className="w-20 text-right font-medium tabular-nums">{formatAZN(slice.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ForecastPoint {
  label: string;
  forecast: number;
  actual: number | null;
}

export function ForecastLineChart({ data }: { data: ForecastPoint[] }) {
  if (!data.length) return <EmptyChart text="Bu biznes üçün plan proqnozu yoxdur." />;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
          <YAxis tickFormatter={compact} tick={axisTick} tickLine={false} axisLine={false} width={44} />
          <Tooltip formatter={tooltipValue} contentStyle={tooltipStyle} />
          <Legend formatter={legendLabel} iconType="plainline" />
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
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 0, fill: CHART_COLORS.revenue }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
