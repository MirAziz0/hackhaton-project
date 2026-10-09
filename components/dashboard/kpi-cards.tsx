"use client";

import { ArrowDownRight, ArrowUpRight, Minus, PiggyBank, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { computeKpis } from "@/lib/finance/dashboard";
import { cn, formatAZN } from "@/lib/utils";
import { useT } from "@/components/i18n/locale-provider";

type Kpis = ReturnType<typeof computeKpis>;

// Large headline figures shown beside the welcome text, as in the reference design.
export function HeadlineStats({ kpis }: { kpis: Kpis }) {
  const t = useT();
  const { current, change } = kpis;

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4">
      <Stat icon={TrendingUp} label={t("Bu ayın gəliri")} value={current.income} change={change.income} goodWhen="up" />
      <Stat icon={TrendingDown} label={t("Bu ayın xərcləri")} value={current.expenses} change={change.expenses} goodWhen="down" />
      <Stat
        icon={PiggyBank}
        label={t("Xalis mənfəət")}
        value={current.net_profit}
        change={change.net_profit}
        goodWhen="up"
        negative={current.net_profit < 0}
      />
    </dl>
  );
}

interface StatProps {
  icon: LucideIcon;
  label: string;
  value: number;
  change: number | null;
  // Whether a rise is good news (income, profit) or bad news (expenses).
  goodWhen: "up" | "down";
  negative?: boolean;
}

function Stat({ icon: Icon, label, value, change, goodWhen, negative }: StatProps) {
  const t = useT();
  const direction = change === null || change === 0 ? "flat" : change > 0 ? "up" : "down";
  const ChangeIcon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const tone =
    direction === "flat" ? "text-muted-foreground" : direction === goodWhen ? "text-emerald-700" : "text-red-700";

  return (
    <div className="flex items-start gap-3">
      <span className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-primary shadow-card">
        <Icon className="size-4" />
      </span>
      <div>
        <dd className={cn("text-4xl font-semibold leading-none tracking-tight tabular-nums", negative && "text-red-700")}>
          {formatAZN(value)}
        </dd>
        <dt className="mt-1.5 text-sm text-muted-foreground">{label}</dt>
        <p className={cn("mt-0.5 flex items-center gap-1 text-xs font-medium", tone)}>
          <ChangeIcon className="size-3.5" />
          {change === null
            ? t("müqayisə yoxdur")
            : t("{change}% ötən aya nisbətən", { change: `${change > 0 ? "+" : ""}${change}` })}
        </p>
      </div>
    </div>
  );
}
