"use client";

import { ForecastChart } from "@/components/studio/forecast-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sumAmounts } from "@/lib/finance/forecast";
import { formatAZN } from "@/lib/utils";
import type { FinancialForecast } from "@/types/database";
import { useT } from "@/components/i18n/locale-provider";

export function ForecastTab({ forecast }: { forecast: FinancialForecast }) {
  const t = useT();
  const startupTotal = sumAmounts(forecast.startup_costs);
  const monthlyTotal = sumAmounts(forecast.monthly_costs);
  const months = forecast.monthly_projection.length;
  const averageRevenue = months
    ? Math.round(forecast.monthly_projection.reduce((total, month) => total + month.revenue, 0) / months)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("Başlanğıc xərcləri")} value={formatAZN(startupTotal)} />
        <StatTile label={t("Aylıq xərclər")} value={formatAZN(monthlyTotal)} />
        <StatTile label={t("Orta aylıq gəlir")} value={formatAZN(averageRevenue)} hint={t("{months} ay üzrə", { months })} />
        <StatTile
          label={t("Zərərsizlik nöqtəsi")}
          value={
            forecast.break_even_month !== null
              ? t("{month}-ci ay", { month: forecast.break_even_month })
              : t("{months} aydan sonra", { months })
          }
          hint={t("Başlanğıc xərclərinin geri qayıtdığı ay")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Aylıq gəlir və xərc proqnozu")}</CardTitle>
          <CardDescription>{t("Bütün rəqəmlər təxminidir və AZN ilə göstərilib.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastChart forecast={forecast} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <CostTable title={t("Başlanğıc xərcləri")} rows={forecast.startup_costs} total={startupTotal} />
        <CostTable title={t("Aylıq xərclər")} rows={forecast.monthly_costs} total={monthlyTotal} />
      </div>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function CostTable({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { item: string; amount: number }[];
  total: number;
}) {
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.item}>
                <td className="py-2.5">{row.item}</td>
                <td className="py-2.5 text-right tabular-nums">{formatAZN(row.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 font-semibold">
              <td className="pt-3">{t("Cəmi")}</td>
              <td className="pt-3 text-right tabular-nums">{formatAZN(total)}</td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}
