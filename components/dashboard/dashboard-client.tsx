"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AssistantPanel } from "@/components/dashboard/assistant-panel";
import {
  ExpenseDonut,
  ForecastLineChart,
  MonthlyBarChart,
  categoryColorMap,
  toDonutSlices,
} from "@/components/dashboard/charts";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TransactionDialog, type TransactionInput } from "@/components/dashboard/transaction-dialog";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { monthKey, monthLabel } from "@/lib/dates";
import {
  categoryBreakdown,
  computeKpis,
  forecastVsActual,
  monthlySeries,
  resolvePeriod,
} from "@/lib/finance/dashboard";
import { createClient } from "@/lib/supabase/client";
import type { FinancialForecast, Transaction } from "@/types/database";

interface DashboardClientProps {
  businesses: { id: string; name: string }[];
  business: { id: string; name: string; financial_forecast: FinancialForecast | null };
  initialTransactions: Transaction[];
  today: string;
}

// Postgres returns numeric columns as strings; normalise once so all math uses numbers.
function normalise(transaction: Transaction): Transaction {
  return { ...transaction, amount: Number(transaction.amount) };
}

export function DashboardClient({ businesses, business, initialTransactions, today }: DashboardClientProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(() => initialTransactions.map(normalise));
  const [dialog, setDialog] = useState<{ transaction: Transaction | null } | null>(null);

  // Everything below is derived from `transactions`, so any add/edit/delete (including one
  // confirmed in the AI chat) updates the KPIs and charts immediately.
  const kpis = useMemo(() => computeKpis(transactions, business.financial_forecast, today), [transactions, business, today]);
  const monthly = useMemo(() => monthlySeries(transactions, 6, today), [transactions, today]);
  const forecast = useMemo(
    () => forecastVsActual(transactions, business.financial_forecast, today),
    [transactions, business, today],
  );
  const categories = useMemo(() => [...new Set(transactions.map((tx) => tx.category))], [transactions]);
  const donut = useMemo(() => {
    const breakdown = categoryBreakdown(transactions, resolvePeriod("this_month", today)!);
    const colorOf = categoryColorMap(transactions.filter((tx) => tx.type === "expense").map((tx) => tx.category));
    return { total: breakdown.total, slices: toDonutSlices(breakdown.categories, colorOf) };
  }, [transactions, today]);

  async function addTransaction(input: TransactionInput) {
    const { data, error } = await createClient()
      .from("transactions")
      .insert({ ...input, business_id: business.id })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "insert failed");
    setTransactions((current) => [...current, normalise(data as Transaction)]);
    router.refresh();
  }

  async function updateTransaction(id: string, input: TransactionInput) {
    const { data, error } = await createClient().from("transactions").update(input).eq("id", id).select("*").single();
    if (error || !data) throw new Error(error?.message ?? "update failed");
    setTransactions((current) => current.map((tx) => (tx.id === id ? normalise(data as Transaction) : tx)));
    router.refresh();
  }

  async function deleteTransaction(transaction: Transaction) {
    const { error } = await createClient().from("transactions").delete().eq("id", transaction.id);
    if (error) return;
    setTransactions((current) => current.filter((tx) => tx.id !== transaction.id));
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{business.name}</h2>
            <p className="text-sm text-muted-foreground">{monthLabel(monthKey(today))} üzrə göstəricilər</p>
          </div>
          {businesses.length > 1 && (
            <select
              aria-label="Biznes seçin"
              value={business.id}
              onChange={(e) => router.push(`/dashboard?business=${e.target.value}`)}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {businesses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <KpiCards kpis={kpis} />

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Aylıq gəlir və xərc</CardTitle>
              <CardDescription>Son 6 ay, AZN</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={monthly} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Xərclər kateqoriyalar üzrə</CardTitle>
              <CardDescription>{monthLabel(monthKey(today))}</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseDonut slices={donut.slices} total={donut.total} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan proqnozu və faktiki gəlir</CardTitle>
            <CardDescription>Biznes planındakı aylıq gəlir proqnozu ilə real gəlirin müqayisəsi, AZN</CardDescription>
          </CardHeader>
          <CardContent>
            <ForecastLineChart data={forecast} />
          </CardContent>
        </Card>

        <TransactionsTable
          transactions={transactions}
          onAdd={() => setDialog({ transaction: null })}
          onEdit={(transaction) => setDialog({ transaction })}
          onDelete={deleteTransaction}
        />
      </div>

      {/* Sticky side panel; its height leaves room for the floating chat button below it. */}
      <div className="xl:sticky xl:top-8 xl:h-[calc(100vh-9rem)] h-[32rem]">
        <AssistantPanel key={business.id} businessId={business.id} onConfirmTransaction={addTransaction} />
      </div>

      {dialog && (
        <TransactionDialog
          transaction={dialog.transaction}
          today={today}
          categories={categories}
          onClose={() => setDialog(null)}
          onSubmit={(input) =>
            dialog.transaction ? updateTransaction(dialog.transaction.id, input) : addTransaction(input)
          }
        />
      )}
    </div>
  );
}
