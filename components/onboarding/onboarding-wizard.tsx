"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  GraduationCap,
  Laptop,
  Lightbulb,
  Loader2,
  Shapes,
  Shirt,
  Sparkles,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  BAKU_DISTRICTS,
  BUDGET_RANGES,
  LOOKING_FOR,
  ONLINE_LOCATION,
  REGIONS,
  STAGES,
  TRACKS,
  homeForStage,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { LookingFor, Stage, Track } from "@/types/database";

const TRACK_ICONS: Record<Track, LucideIcon> = {
  cosmetics: Sparkles,
  food: UtensilsCrossed,
  clothing: Shirt,
  it_services: Laptop,
  education: GraduationCap,
  other: Shapes,
};

const STAGE_ICONS: Record<Stage, LucideIcon> = {
  idea: Lightbulb,
  plan_ready: FileCheck2,
  operating: Store,
};

const STEPS = [
  { title: "Hansı sahədə biznes qurursunuz?", hint: "Sizə uyğun tövsiyələr üçün sahəni seçin." },
  { title: "Hazırda hansı mərhələdəsiniz?", hint: "Buna görə sizi uyğun bölməyə yönləndirəcəyik." },
  { title: "Başlanğıc büdcəniz nə qədərdir?", hint: "Təxmini aralıq kifayətdir." },
  { title: "Biznesiniz harada yerləşəcək?", hint: "Bakı rayonu, region və ya onlayn seçin." },
  { title: "Hansı məhsul və ya xidmətləri təklif edirsiniz?", hint: "Qısa şəkildə təsvir edin." },
  { title: "Hədəf müştəriniz kimdir?", hint: "Yaş, maraqlar, gəlir səviyyəsi və s." },
  { title: "Nə axtarırsınız?", hint: "Bir neçəsini seçə bilərsiniz." },
];

interface Answers {
  track: Track | null;
  stage: Stage | null;
  budget_range: string | null;
  city: string | null;
  products: string;
  target_customer: string;
  looking_for: LookingFor[];
}

const INITIAL: Answers = {
  track: null,
  stage: null,
  budget_range: null,
  city: null,
  products: "",
  target_customer: "",
  looking_for: [],
};

export function OnboardingWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLast = step === STEPS.length - 1;

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLookingFor(value: LookingFor) {
    setAnswers((prev) => ({
      ...prev,
      looking_for: prev.looking_for.includes(value)
        ? prev.looking_for.filter((item) => item !== value)
        : [...prev.looking_for, value],
    }));
  }

  const canContinue = [
    answers.track !== null,
    answers.stage !== null,
    answers.budget_range !== null,
    answers.city !== null,
    answers.products.trim().length >= 3,
    answers.target_customer.trim().length >= 3,
    answers.looking_for.length > 0,
  ][step];

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: saveError } = await supabase.from("profiles").upsert({
        id: userId,
        track: answers.track,
        stage: answers.stage,
        budget_range: answers.budget_range,
        city: answers.city,
        products: answers.products.trim(),
        target_customer: answers.target_customer.trim(),
        looking_for: answers.looking_for,
        onboarding_completed: true,
      });
      if (saveError) throw saveError;
      router.push(homeForStage(answers.stage));
      router.refresh();
    } catch {
      setError("Məlumatları yadda saxlamaq mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.");
      setSaving(false);
    }
  }

  function next() {
    if (!canContinue) return;
    if (isLast) void finish();
    else setStep((current) => current + 1);
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Addım {step + 1} / {STEPS.length}
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{STEPS[step].title}</h1>
            <p className="text-sm text-muted-foreground">{STEPS[step].hint}</p>
          </div>

          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {TRACKS.map((track) => (
                <OptionCard
                  key={track.value}
                  label={track.label}
                  description={track.description}
                  icon={TRACK_ICONS[track.value]}
                  selected={answers.track === track.value}
                  onClick={() => update("track", track.value)}
                />
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-3">
              {STAGES.map((stage) => (
                <OptionCard
                  key={stage.value}
                  label={stage.label}
                  description={stage.description}
                  icon={STAGE_ICONS[stage.value]}
                  selected={answers.stage === stage.value}
                  onClick={() => update("stage", stage.value)}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {BUDGET_RANGES.map((range) => (
                <OptionCard
                  key={range.value}
                  label={range.label}
                  selected={answers.budget_range === range.value}
                  onClick={() => update("budget_range", range.value)}
                  compact
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <LocationGroup
                title="Bakı"
                options={BAKU_DISTRICTS.map((district) => ({
                  value: `Bakı, ${district}`,
                  label: district,
                }))}
                selected={answers.city}
                onSelect={(value) => update("city", value)}
              />
              <LocationGroup
                title="Regionlar"
                options={REGIONS.map((region) => ({ value: region, label: region }))}
                selected={answers.city}
                onSelect={(value) => update("city", value)}
              />
              <LocationGroup
                title="Onlayn"
                options={[{ value: ONLINE_LOCATION, label: "Yalnız onlayn" }]}
                selected={answers.city}
                onSelect={(value) => update("city", value)}
              />
            </div>
          )}

          {step === 4 && (
            <Textarea
              autoFocus
              value={answers.products}
              onChange={(e) => update("products", e.target.value)}
              placeholder="Məsələn: təbii tərkibli üz kremləri, sabunlar və hədiyyə dəstləri"
            />
          )}

          {step === 5 && (
            <Textarea
              autoFocus
              value={answers.target_customer}
              onChange={(e) => update("target_customer", e.target.value)}
              placeholder="Məsələn: 20–40 yaş arası, təbii məhsullara üstünlük verən qadınlar"
            />
          )}

          {step === 6 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {LOOKING_FOR.map((item) => (
                <OptionCard
                  key={item.value}
                  label={item.label}
                  selected={answers.looking_for.includes(item.value)}
                  onClick={() => toggleLookingFor(item.value)}
                  compact
                />
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => setStep((current) => current - 1)}
              disabled={step === 0 || saving}
            >
              <ArrowLeft />
              Geri
            </Button>
            <Button onClick={next} disabled={!canContinue || saving}>
              {saving && <Loader2 className="animate-spin" />}
              {isLast ? "Tamamla" : "Növbəti"}
              {!isLast && <ArrowRight />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface LocationGroupProps {
  title: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
}

function LocationGroup({ title, options, selected, onSelect }: LocationGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.value)}
              className={
                active
                  ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  : "rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:border-primary/50"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
