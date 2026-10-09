import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { computeKpis } from "@/lib/finance/dashboard";
import { cn, formatAZN } from "@/lib/utils";

type Kpis = ReturnType<typeof computeKpis>;

export function KpiCards({ kpis }: { kpis: Kpis }) {
  const { current, change, forecast } = kpis;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Bu ayın gəliri" value={formatAZN(current.income)} change={change.income} goodWhen="up" />
      <KpiCard label="Bu ayın xərcləri" value={formatAZN(current.expenses)} change={change.expenses} goodWhen="down" />
      <KpiCard
        label="Xalis mənfəət"
        value={formatAZN(current.net_profit)}
        change={change.net_profit}
        goodWhen="up"
        negative={current.net_profit < 0}
      />
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Proqnoza doğru irəliləyiş</p>
          {forecast ? (
            <>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{forecast.progress_pct}%</p>
              <Progress value={forecast.progress_pct} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {formatAZN(forecast.actual)} / {formatAZN(forecast.target)} aylıq hədəf
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-2xl font-semibold text-muted-foreground">—</p>
              <p className="mt-2 text-xs text-muted-foreground">Bu ay üçün plan proqnozu yoxdur.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  change: number | null;
  // Whether a rise is good news (income, profit) or bad news (expenses).
  goodWhen: "up" | "down";
  negative?: boolean;
}

function KpiCard({ label, value, change, goodWhen, negative }: KpiCardProps) {
  const direction = change === null || change === 0 ? "flat" : change > 0 ? "up" : "down";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const tone =
    direction === "flat" ? "text-muted-foreground" : direction === goodWhen ? "text-emerald-700" : "text-red-700";

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold tabular-nums", negative && "text-red-700")}>{value}</p>
        <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", tone)}>
          <Icon className="size-3.5" />
          {change === null ? "Ötən ayla müqayisə yoxdur" : `${change > 0 ? "+" : ""}${change}% ötən aya nisbətən`}
        </p>
      </CardContent>
    </Card>
  );
}
