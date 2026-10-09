import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAZN } from "@/lib/utils";
import type { BusinessPlan } from "@/types/database";

export function PlanTab({ plan }: { plan: BusinessPlan }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Xülasə</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed">{plan.summary}</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Məhsul və xidmətlər</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {plan.products.map((product) => (
              <li key={product.name} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{formatAZN(product.price_azn)}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hədəf auditoriya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{plan.target_audience}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Qiymət strategiyası</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{plan.pricing_strategy}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Marketinq planı</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {plan.marketing_plan.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>İlk 6 ayın yol xəritəsi</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plan.roadmap.map((step) => (
              <li key={step.month} className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{step.month}-ci ay</p>
                <p className="mt-1 font-medium">{step.title}</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {step.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
