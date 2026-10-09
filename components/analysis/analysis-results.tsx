"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  MapPin,
  ShieldAlert,
  ThumbsUp,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { CitedText, EstimateBadge, PlanBadge, SourceBadge } from "@/components/analysis/cited-text";
import { ScoreGauge } from "@/components/analysis/score-gauge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Analysis, BudgetStatus, Priority, SourceReference } from "@/types/analysis";
import { useT } from "@/components/i18n/locale-provider";

const FIT_REGIONS = [
  { key: "baku", label: "Bakı" },
  { key: "regions", label: "Regionlar" },
  { key: "online", label: "Onlayn" },
] as const;

const SWOT_CARDS: {
  key: "strengths" | "weaknesses" | "opportunities" | "threats";
  label: string;
  icon: LucideIcon;
  className: string;
}[] = [
  { key: "strengths", label: "Güclü tərəflər", icon: ThumbsUp, className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  { key: "weaknesses", label: "Zəif tərəflər", icon: AlertTriangle, className: "border-red-200 bg-red-50 text-red-900" },
  { key: "opportunities", label: "İmkanlar##swot", icon: TrendingUp, className: "border-sky-200 bg-sky-50 text-sky-900" },
  { key: "threats", label: "Təhlükələr", icon: ShieldAlert, className: "border-amber-200 bg-amber-50 text-amber-900" },
];

const BUDGET_STATUS: Record<BudgetStatus, { label: string; icon: LucideIcon; variant: "warning" | "success" | "destructive" }> = {
  low: { label: "Çox aşağı", icon: ArrowDown, variant: "warning" },
  ok: { label: "Uyğundur", icon: Check, variant: "success" },
  high: { label: "Çox yüksək", icon: ArrowUp, variant: "destructive" },
};

const PRIORITY: Record<Priority, { label: string; variant: "destructive" | "warning" | "secondary" }> = {
  high: { label: "Yüksək", variant: "destructive" },
  medium: { label: "Orta", variant: "warning" },
  low: { label: "Aşağı", variant: "secondary" },
};
const PRIORITY_ORDER: Priority[] = ["high", "medium", "low"];

export function AnalysisResults({ analysis }: { analysis: Analysis }) {
  const t = useT();
  const { market_fit: fit, sources } = analysis;
  const references = sources.references ?? [];
  const findReference = (id: string | null) => references.find((item) => item.id === id);
  const recommendations = [...analysis.recommendations].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("İnvestisiyaya hazırlıq")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreGauge score={analysis.overall_score} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("Ümumi qiymətləndirmə")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="leading-relaxed">
              <CitedText text={fit.summary} references={references} />
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              {sources.figures.map((figure) => {
                const reference = findReference(figure.source_id);
                return (
                  <div key={figure.label} className="rounded-lg border bg-muted/40 p-3">
                    <dt className="text-xs text-muted-foreground">{figure.label}</dt>
                    <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold">
                      {figure.value}
                      {reference ? (
                        <SourceBadge reference={reference} />
                      ) : figure.source_id === "PLAN" ? (
                        <PlanBadge />
                      ) : (
                        <EstimateBadge />
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-3" aria-label={t("Bazara uyğunluq")}>
        {FIT_REGIONS.map(({ key, label }) => (
          <Card key={key}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold">{t(label)}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {fit[key].score}
                  <span className="text-sm font-normal text-muted-foreground"> / 100</span>
                </p>
              </div>
              <Progress value={fit[key].score} />
              <p className="text-sm leading-relaxed text-muted-foreground">
                <CitedText text={fit[key].reason} references={references} />
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2" aria-label={t("SWOT təhlili")}>
        {SWOT_CARDS.map(({ key, label, icon: Icon, className }) => (
          <div key={key} className={cn("rounded-xl border p-5", className)}>
            <p className="flex items-center gap-2 font-semibold">
              <Icon className="size-4" />
              {t(label)}
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
              {analysis.swot[key].map((item) => (
                <li key={item}>
                  <CitedText text={item} references={references} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("Məkan təhlili")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              <CitedText text={fit.location_analysis.assessment} references={references} />
            </p>
            {fit.location_analysis.alternatives.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Alternativ məkanlar")}
                </p>
                {fit.location_analysis.alternatives.map((alternative) => (
                  <div key={alternative.name} className="flex gap-3 rounded-lg border bg-muted/40 p-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{alternative.name}</p>
                      <p className="text-sm text-muted-foreground">
                        <CitedText text={alternative.reason} references={references} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Büdcə yoxlaması")}</CardTitle>
            <CardDescription>{t("Hansı xərc kateqoriyaları çox aşağı və ya çox yüksək görünür.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {analysis.budget_check.map((item) => {
                const status = BUDGET_STATUS[item.status];
                return (
                  <li key={item.category} className="space-y-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{item.category}</p>
                      <Badge variant={status.variant} className="shrink-0 gap-1">
                        <status.icon className="size-3" />
                        {t(status.label)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <CitedText text={item.comment} references={references} />
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Rəqiblər və fərqlənmə")}</CardTitle>
          {!sources.web_search_used && (
            <CardDescription>
              {t("Veb axtarış qoşulmayıb, ona görə konkret şirkət adları əvəzinə rəqib tipləri göstərilir.")}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {analysis.competitors.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {analysis.competitors.map((competitor) => {
                const reference = findReference(competitor.source_id);
                return (
                  <div key={competitor.name} className="space-y-2 rounded-lg border p-4">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {competitor.name}
                      {reference ? <SourceBadge reference={reference} /> : <EstimateBadge />}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <CitedText text={competitor.description} references={references} />
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">{t("Necə fərqlənməli:")} </span>
                      <CitedText text={competitor.differentiation} references={references} />
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("Rəqib məlumatı tapılmadı.")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Tövsiyələr")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {recommendations.map((item) => (
              <li key={item.title} className="flex gap-3 rounded-lg border p-4">
                <Badge variant={PRIORITY[item.priority].variant} className="h-fit shrink-0">
                  {t(PRIORITY[item.priority].label)}
                </Badge>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <CitedText text={item.detail} references={references} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Mənbələr")}</CardTitle>
          <CardDescription>
            {t("Mənbəyi olmayan rəqəmlər “təxmini” kimi işarələnib və süni intellektin öz qiymətləndirməsidir.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {references.length ? (
            <ul className="divide-y text-sm">
              {references.map((reference) => (
                <ReferenceRow key={reference.id} reference={reference} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("Bu analizdə xarici mənbəyə istinad edilməyib; bütün rəqəmlər təxminidir.")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferenceRow({ reference }: { reference: SourceReference }) {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <SourceBadge reference={reference} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{reference.detail}</p>
        {reference.url ? (
          <a
            href={reference.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <span className="truncate">{reference.name}</span>
            <ExternalLink className="size-3 shrink-0" />
          </a>
        ) : (
          <p className="text-muted-foreground">{reference.name}</p>
        )}
      </div>
    </li>
  );
}
