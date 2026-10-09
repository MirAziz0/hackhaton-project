"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/types/database";
import { useT } from "@/components/i18n/locale-provider";

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string | null;
}

interface TransactionDialogProps {
  // Existing transaction when editing, null when adding.
  transaction: Transaction | null;
  today: string;
  categories: string[];
  onClose: () => void;
  onSubmit: (input: TransactionInput) => Promise<void>;
}

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Gəlir" },
  { value: "expense", label: "Xərc" },
];

export function TransactionDialog({ transaction, today, categories, onClose, onSubmit }: TransactionDialogProps) {
  const t = useT();
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "income");
  // "Gəlir" and "Xərc" each keep their own amount and category, so switching between the two
  // never carries one side's values over to the other.
  const [drafts, setDrafts] = useState<Record<TransactionType, { amount: string; category: string }>>(() => {
    const empty = { amount: "", category: "" };
    const filled = transaction ? { amount: String(transaction.amount), category: transaction.category } : empty;
    const initialType = transaction?.type ?? "income";
    return { income: initialType === "income" ? filled : empty, expense: initialType === "expense" ? filled : empty };
  });
  const { amount, category } = drafts[type];
  const setAmount = (value: string) => setDrafts((current) => ({ ...current, [type]: { ...current[type], amount: value } }));
  const setCategory = (value: string) =>
    setDrafts((current) => ({ ...current, [type]: { ...current[type], category: value } }));
  const [date, setDate] = useState(transaction?.date ?? today);
  const [note, setNote] = useState(transaction?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = Number(amount.replace(",", "."));
  const valid = parsedAmount > 0 && category.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        type,
        amount: Math.round(parsedAmount * 100) / 100,
        category: category.trim(),
        date,
        note: note.trim() || null,
      });
      onClose();
    } catch {
      setError(t("Əməliyyatı yadda saxlamaq mümkün olmadı. Yenidən cəhd edin."));
      setSaving(false);
    }
  }

  return (
    <Dialog open title={transaction ? t("Əməliyyatı redaktə et") : t("Yeni əməliyyat")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          {TYPES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={type === item.value}
              onClick={() => setType(item.value)}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                type === item.value ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(item.label)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tx-amount">{type === "income" ? t("Gəlir məbləği (₼)") : t("Xərc məbləği (₼)")}</Label>
            <Input
              id="tx-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder={type === "income" ? "450" : "120"}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-date">{t("Tarix")}</Label>
            <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tx-category">{t("Kateqoriya")}</Label>
          <Input
            id="tx-category"
            list="tx-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={type === "income" ? t("Mağaza satışı") : t("İcarə")}
            maxLength={60}
            required
          />
          <datalist id="tx-categories">
            {categories.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tx-note">{t("Qeyd (istəyə görə)")}</Label>
          <Input id="tx-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t("Ləğv et")}
          </Button>
          <Button type="submit" disabled={!valid || saving}>
            {saving && <Loader2 className="animate-spin" />}
            {t("Yadda saxla")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
