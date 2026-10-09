"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, monthKey, monthLabel } from "@/lib/dates";
import { cn, formatAZN } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/types/database";

const SELECT_CLASS =
  "h-9 rounded-full border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

interface TransactionsTableProps {
  transactions: Transaction[];
  onAdd: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => Promise<void>;
}

export function TransactionsTable({ transactions, onAdd, onEdit, onDelete }: TransactionsTableProps) {
  const [month, setMonth] = useState("all");
  const [type, setType] = useState<"all" | TransactionType>("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const months = useMemo(
    () => [...new Set(transactions.map((tx) => monthKey(tx.date)))].sort().reverse(),
    [transactions],
  );

  const visible = useMemo(
    () =>
      transactions
        .filter((tx) => (month === "all" || monthKey(tx.date) === month) && (type === "all" || tx.type === type))
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
    [transactions, month, type],
  );

  async function remove(transaction: Transaction) {
    setDeletingId(transaction.id);
    try {
      await onDelete(transaction);
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Əməliyyatlar</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Ay üzrə filtr" value={month} onChange={(e) => setMonth(e.target.value)} className={SELECT_CLASS}>
            <option value="all">Bütün aylar</option>
            {months.map((key) => (
              <option key={key} value={key}>
                {monthLabel(key)}
              </option>
            ))}
          </select>
          <select
            aria-label="Növ üzrə filtr"
            value={type}
            onChange={(e) => setType(e.target.value as "all" | TransactionType)}
            className={SELECT_CLASS}
          >
            <option value="all">Bütün növlər</option>
            <option value="income">Gəlir</option>
            <option value="expense">Xərc</option>
          </select>
          <Button size="sm" className="h-9" onClick={onAdd}>
            <Plus />
            Əməliyyat əlavə et
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {visible.length ? (
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#e6f9ea] text-left text-xs text-foreground/70">
                <tr>
                  <th className="rounded-l-full py-2.5 pl-4 pr-4 font-medium">Tarix</th>
                  <th className="py-2 pr-4 font-medium">Növ</th>
                  <th className="py-2 pr-4 font-medium">Kateqoriya</th>
                  <th className="py-2 pr-4 font-medium">Qeyd</th>
                  <th className="py-2 pr-4 text-right font-medium">Məbləğ</th>
                  <th className="rounded-r-full py-2.5 pr-4 font-medium">
                    <span className="sr-only">Əməliyyatlar</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/40">
                    <td className="whitespace-nowrap py-3 pl-4 pr-4">{formatDate(tx.date)}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant={tx.type === "income" ? "success" : "warning"}>
                        {tx.type === "income" ? "Gəlir" : "Xərc"}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{tx.category}</td>
                    <td className="max-w-56 truncate py-2.5 pr-4 text-muted-foreground" title={tx.note ?? undefined}>
                      {tx.note || "—"}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap py-2.5 pr-4 text-right font-semibold tabular-nums",
                        tx.type === "income" ? "text-emerald-700" : "text-foreground",
                      )}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {formatAZN(tx.amount)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-2 text-right">
                      {confirmingId === tx.id ? (
                        <span className="inline-flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void remove(tx)}
                            disabled={deletingId === tx.id}
                          >
                            Sil
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirmingId(null)}>
                            Xeyr
                          </Button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            aria-label="Redaktə et"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(tx.id)}
                            aria-label="Sil"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {transactions.length
              ? "Seçilmiş filtrə uyğun əməliyyat yoxdur."
              : "Hələ əməliyyat yoxdur. İlk gəlir və ya xərcinizi əlavə edin, yaxud AI köməkçiyə yazın."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
