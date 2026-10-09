"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, FileText, FileUp, History, PenLine, SearchCheck } from "lucide-react";
import { AnalysisResults } from "@/components/analysis/analysis-results";
import { GeneratingCard } from "@/components/studio/generating-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TRACKS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import type { Analysis } from "@/types/analysis";
import { useT } from "@/components/i18n/locale-provider";
import type { Translate } from "@/lib/i18n/translate";

type Source = "business" | "pdf" | "form";

const ANALYSIS_STEPS = [
  "Planınız oxunur",
  "Bazar məlumatları toplanır",
  "Rəqiblər araşdırılır",
  "SWOT və büdcə təhlil edilir",
  "Tövsiyələr və mənbələr hazırlanır",
];

const GENERIC_ERROR = "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.";
// Vercel rejects request bodies above 4.5 MB, so stay safely below that.
const MAX_PDF_BYTES = 4 * 1024 * 1024;
const SELECT_CLASS =
  "flex h-11 w-full rounded-md border border-input bg-card px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

// Message for responses that carry no JSON error (for example a host-level timeout page).
function statusMessage(status: number, t: Translate) {
  if (status === 413) return t("Fayl çox böyükdür. Ən çox 4 MB ölçüdə PDF yükləyin.");
  if (status === 504 || status === 408) return t("Analiz çox uzun çəkdi və dayandırıldı. Zəhmət olmasa yenidən cəhd edin.");
  return t("Serverdə xəta baş verdi (kod {status}). Zəhmət olmasa yenidən cəhd edin.", { status });
}

interface AnalysisWorkspaceProps {
  businesses: { id: string; name: string }[];
  latestAnalyses: Record<string, Analysis>;
  initialBusinessId: string | null;
  defaults: { sector: string; location: string; products: string };
}

export function AnalysisWorkspace({ businesses, latestAnalyses, initialBusinessId, defaults }: AnalysisWorkspaceProps) {
  const t = useT();
  const router = useRouter();
  const tabs: TabItem<Source>[] = [
    ...(businesses.length ? [{ value: "business" as const, label: t("Saxlanmış biznes"), icon: Briefcase }] : []),
    { value: "pdf", label: t("PDF yüklə"), icon: FileUp },
    { value: "form", label: t("Forma doldur"), icon: PenLine },
  ];

  const [source, setSource] = useState<Source>(businesses.length ? "business" : "form");
  const [businessId, setBusinessId] = useState(initialBusinessId ?? businesses[0]?.id ?? "");
  const [sector, setSector] = useState(defaults.sector);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    idea: "",
    location: defaults.location,
    budget: "",
    products: defaults.products,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ analysis: Analysis; businessName: string } | null>(null);
  // Analyses created in this session, so "view last analysis" works before the page data refreshes.
  const [fresh, setFresh] = useState<Record<string, Analysis>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedBusiness = businesses.find((business) => business.id === businessId);
  const lastAnalysis = fresh[businessId] ?? latestAnalyses[businessId];

  const canSubmit =
    source === "business"
      ? Boolean(selectedBusiness)
      : source === "pdf"
        ? Boolean(file)
        : form.name.trim().length >= 2 && form.idea.trim().length >= 20;

  function chooseFile(next: File | null) {
    setError(null);
    if (next && next.size > MAX_PDF_BYTES) {
      setFile(null);
      setError(t("PDF faylı 4 MB-dan böyük olmamalıdır."));
      return;
    }
    setFile(next);
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("source", source);
      body.set("sector", sector);
      if (source === "business") body.set("business_id", businessId);
      if (source === "pdf" && file) body.set("file", file);
      if (source === "form") Object.entries(form).forEach(([key, value]) => body.set(key, value));

      const response = await fetch("/api/analysis", { method: "POST", body });
      const json = (await response.json().catch(() => null)) as {
        analysis?: Analysis;
        business?: { id: string; name: string };
        error?: string;
      } | null;
      if (!response.ok || !json?.analysis || !json.business) {
        throw new Error(json?.error ?? (response.ok ? t(GENERIC_ERROR) : statusMessage(response.status, t)));
      }

      setFresh((current) => ({ ...current, [json.business!.id]: json.analysis! }));
      setResult({ analysis: json.analysis, businessName: json.business.name });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(GENERIC_ERROR));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <GeneratingCard title={t("Planınız təhlil edilir")} steps={ANALYSIS_STEPS} hint={t("Bu, adətən 20–40 saniyə çəkir.")} />;
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setResult(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("Yeni analiz")}
          </button>
          <h2 className="text-2xl font-semibold tracking-tight">{result.businessName}</h2>
          <p className="text-sm text-muted-foreground">{t("Analiz tarixi:")} {formatDate(result.analysis.created_at, t)}</p>
        </div>
        <AnalysisResults analysis={result.analysis} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs items={tabs} value={source} onChange={(value) => { setSource(value); setError(null); }} />

      <Card>
        <CardContent className="space-y-5 p-6">
          {source === "business" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business">{t("Biznes seçin")}</Label>
                <select
                  id="business"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {t("Studiyada və ya əvvəlki analizlərdə saxladığınız bizneslər.")}
                </p>
              </div>

              {lastAnalysis && selectedBusiness && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <History className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {t("Son analiz: {score} / 100", { score: lastAnalysis.overall_score })}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(lastAnalysis.created_at, t)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResult({ analysis: lastAnalysis, businessName: selectedBusiness.name })}
                  >
                    {t("Nəticəyə bax")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {source === "pdf" && (
            <div className="space-y-2">
              <Label htmlFor="plan-file">{t("Biznes planı (PDF, ən çox 4 MB)")}</Label>
              <input
                ref={fileInput}
                id="plan-file"
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {file ? (
                  <>
                    <FileText className="size-8 text-primary" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("{size} MB · dəyişmək üçün klikləyin", { size: (file.size / 1024 / 1024).toFixed(1) })}
                    </span>
                  </>
                ) : (
                  <>
                    <FileUp className="size-8 text-muted-foreground" />
                    <span className="font-medium">{t("PDF faylı seçmək üçün klikləyin")}</span>
                    <span className="text-xs text-muted-foreground">{t("Mətn əsaslı PDF olmalıdır (skan yox)")}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {source === "form" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">{t("Biznesin adı")}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("Məsələn: Nur Cosmetics")}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="idea">{t("İdeya və plan")}</Label>
                <Textarea
                  id="idea"
                  value={form.idea}
                  onChange={(e) => setForm({ ...form, idea: e.target.value })}
                  placeholder={t("Biznesinizi, satış kanallarını və planlaşdırdığınız xərcləri təsvir edin...")}
                  className="min-h-32"
                  maxLength={4000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t("Məkan")}</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder={t("Bakı, Nəsimi")}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">{t("Büdcə (AZN)")}</Label>
                <Input
                  id="budget"
                  inputMode="numeric"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value.replace(/[^\d]/g, "") })}
                  placeholder="25000"
                  maxLength={12}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="products">{t("Məhsul və xidmətlər")}</Label>
                <Input
                  id="products"
                  value={form.products}
                  onChange={(e) => setForm({ ...form, products: e.target.value })}
                  placeholder={t("Üz kremləri, sabunlar, hədiyyə dəstləri")}
                  maxLength={1000}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 border-t pt-5">
            <Label htmlFor="sector">{t("Biznesin sahəsi")}</Label>
            <select id="sector" value={sector} onChange={(e) => setSector(e.target.value)} className={SELECT_CLASS}>
              {TRACKS.map((track) => (
                <option key={track.value} value={track.value}>
                  {t(track.label)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {t("Bazar məlumatları bu sahə üzrə seçilir. Təhsil və “Digər” sahələri üçün hələ bazar məlumatı yoxdur.")}
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={() => void analyze()} disabled={!canSubmit}>
              <SearchCheck />
              {source === "business" && lastAnalysis ? t("Yenidən analiz et") : t("Analiz et")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
