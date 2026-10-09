"use client";

import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  MapPin,
  Palette,
  Save,
  SearchCheck,
} from "lucide-react";
import { BrandingTab, type ImageStatus } from "@/components/studio/tabs/branding-tab";
import { ForecastTab } from "@/components/studio/tabs/forecast-tab";
import { IdeasTab } from "@/components/studio/tabs/ideas-tab";
import { LocationsTab } from "@/components/studio/tabs/locations-tab";
import { PlanTab } from "@/components/studio/tabs/plan-tab";
import { Button } from "@/components/ui/button";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import type { StudioBusiness } from "@/types/studio";

type TabValue = "plan" | "forecast" | "locations" | "branding" | "ideas";
export type PendingAction = "save" | "analysis" | "dashboard" | null;

const TABS: TabItem<TabValue>[] = [
  { value: "plan", label: "Biznes planı", icon: FileText },
  { value: "forecast", label: "Maliyyə proqnozu", icon: BarChart3 },
  { value: "locations", label: "Məkan tövsiyəsi", icon: MapPin },
  { value: "branding", label: "Brendinq", icon: Palette },
  { value: "ideas", label: "Əlavə ideyalar", icon: Lightbulb },
];

interface StudioResultsProps {
  business: StudioBusiness;
  saved: boolean;
  pendingAction: PendingAction;
  error: string | null;
  imageStatus: ImageStatus;
  imageNotice: string | null;
  onSave: () => void;
  onSendToAnalysis: () => void;
  onAddToDashboard: () => void;
  onGenerateImages: () => void;
  onBack: () => void;
}

export function StudioResults({
  business,
  saved,
  pendingAction,
  error,
  imageStatus,
  imageNotice,
  onSave,
  onSendToAnalysis,
  onAddToDashboard,
  onGenerateImages,
  onBack,
}: StudioResultsProps) {
  const [tab, setTab] = useState<TabValue>("plan");
  const busy = pendingAction !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Yeni ideya
          </button>
          <h2 className="text-2xl font-semibold tracking-tight">{business.name}</h2>
          {business.branding.slogans[0] && (
            <p className="text-muted-foreground">{business.branding.slogans[0]}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onSave} disabled={busy || saved}>
            {pendingAction === "save" ? <Loader2 className="animate-spin" /> : saved ? <Check /> : <Save />}
            {saved ? "Yadda saxlanıldı" : "Yadda saxla"}
          </Button>
          <Button variant="outline" onClick={onSendToAnalysis} disabled={busy}>
            {pendingAction === "analysis" ? <Loader2 className="animate-spin" /> : <SearchCheck />}
            Analizə göndər
          </Button>
          <Button onClick={onAddToDashboard} disabled={busy}>
            {pendingAction === "dashboard" ? <Loader2 className="animate-spin" /> : <LayoutDashboard />}
            Dashboard-a əlavə et
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Tabs items={TABS} value={tab} onChange={setTab} />

      <div role="tabpanel">
        {tab === "plan" && <PlanTab plan={business.plan} />}
        {tab === "forecast" && <ForecastTab forecast={business.financial_forecast} />}
        {tab === "locations" && <LocationsTab locations={business.locations} />}
        {tab === "branding" && (
          <BrandingTab
            branding={business.branding}
            imageStatus={imageStatus}
            imageNotice={imageNotice}
            onGenerateImages={onGenerateImages}
          />
        )}
        {tab === "ideas" && <IdeasTab ideas={business.plan.extra_ideas} />}
      </div>
    </div>
  );
}
