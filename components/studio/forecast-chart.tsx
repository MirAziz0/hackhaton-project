"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { formatAZN } from "@/lib/utils";
import type { FinancialForecast } from "@/types/database";

const SERIES_LABELS: Record<string, string> = { revenue: "Gəlir", costs: "Xərc" };

function compactAZN(value: number) {
  return value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value);
}

export function ForecastChart({ forecast }: { forecast: FinancialForecast }) {
  const data = forecast.monthly_projection;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(month: number) => `${month}-ci ay`}
            tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={compactAZN}
            tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            formatter={(value, name) => [formatAZN(Number(value)), SERIES_LABELS[String(name)] ?? name]}
            labelFormatter={(month) => `${month}-ci ay`}
            contentStyle={{ borderRadius: 8, borderColor: CHART_COLORS.grid, fontSize: 13 }}
          />
          <Legend
            formatter={(value) => <span className="text-sm text-foreground">{SERIES_LABELS[String(value)] ?? value}</span>}
            iconType="plainline"
          />
          {forecast.break_even_month !== null && (
            <ReferenceLine
              x={forecast.break_even_month}
              stroke={CHART_COLORS.axis}
              strokeDasharray="4 4"
              label={{ value: "Zərərsizlik", position: "insideTopRight", fill: CHART_COLORS.axis, fontSize: 12 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={CHART_COLORS.revenue}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.revenue }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="costs"
            stroke={CHART_COLORS.costs}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS.costs }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
