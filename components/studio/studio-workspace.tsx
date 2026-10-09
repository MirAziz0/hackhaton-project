"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClarifyChat, type ClarifyAnswer } from "@/components/studio/clarify-chat";
import { GeneratingCard } from "@/components/studio/generating-card";
import { IdeaForm } from "@/components/studio/idea-form";
import { SavedPlans } from "@/components/studio/saved-plans";
import { StudioResults, type PendingAction } from "@/components/studio/studio-results";
import type { ImageStatus } from "@/components/studio/tabs/branding-tab";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/i18n/locale-provider";
import type { Business } from "@/types/database";
import type { BrandingImages, StudioBusiness } from "@/types/studio";

type Phase = "idea" | "clarifying" | "questions" | "generating" | "result";

const GENERIC_ERROR = "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.";
const SAVE_ERROR = "Planı yadda saxlamaq mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.";
const PLACEHOLDER_NOTICE =
  "AI şəkil xidməti hazırda əlçatan deyil, ona görə nümunə vizuallar göstərilir.";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok || !json) throw new Error(json?.error ?? GENERIC_ERROR);
  return json;
}

// Saved rows can have null JSON columns (e.g. a business created from the Analysis form).
function toStudioBusiness(business: Business): StudioBusiness | null {
  if (!business.plan || !business.financial_forecast) return null;
  return {
    name: business.name,
    idea_text: business.idea_text ?? "",
    plan: business.plan,
    financial_forecast: business.financial_forecast,
    locations: business.locations ?? [],
    branding: {
      name_ideas: business.branding?.name_ideas ?? [],
      slogans: business.branding?.slogans ?? [],
      logo_urls: business.branding?.logo_urls ?? [],
      banner_url: business.branding?.banner_url ?? null,
      visual_style: business.branding?.visual_style,
    },
  };
}

interface StudioWorkspaceProps {
  userId: string;
  savedBusinesses: Business[];
}

export function StudioWorkspace({ userId, savedBusinesses }: StudioWorkspaceProps) {
  const t = useT();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idea");
  const [idea, setIdea] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [business, setBusiness] = useState<StudioBusiness | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [imageStatus, setImageStatus] = useState<ImageStatus>("idle");
  const [imageNotice, setImageNotice] = useState<string | null>(null);

  // Refs let the long-running image request see the latest state when it resolves.
  const savedIdRef = useRef<string | null>(null);
  const sessionRef = useRef(0);

  function setSaved(id: string | null) {
    savedIdRef.current = id;
    setSavedId(id);
  }

  function showResult(next: StudioBusiness, id: string | null) {
    sessionRef.current += 1;
    setBusiness(next);
    setSaved(id);
    setDirty(false);
    setError(null);
    setImageStatus("idle");
    setImageNotice(null);
    setPhase("result");
  }

  async function submitIdea(text: string) {
    setIdea(text);
    setError(null);
    setPhase("clarifying");
    try {
      const { questions: asked } = await postJson<{ questions: string[] }>("/api/studio", {
        mode: "clarify",
        idea: text,
      });
      if (asked.length) {
        setQuestions(asked);
        setPhase("questions");
      } else {
        await generate(text, []);
      }
    } catch (err) {
      setError(t(err instanceof Error ? err.message : GENERIC_ERROR));
      setPhase("idea");
    }
  }

  async function generate(text: string, answers: ClarifyAnswer[]) {
    setError(null);
    setPhase("generating");
    try {
      const { business: generated } = await postJson<{ business: StudioBusiness }>("/api/studio", {
        mode: "plan",
        idea: text,
        answers,
      });
      showResult(generated, null);
      // Images start right away in the background, so the user reads the plan while they render.
      void generateImages(generated);
    } catch (err) {
      setError(t(err instanceof Error ? err.message : GENERIC_ERROR));
      setPhase("idea");
    }
  }

  async function generateImages(target: StudioBusiness) {
    const session = sessionRef.current;
    setImageStatus("loading");
    setImageNotice(null);
    try {
      const images = await postJson<BrandingImages>("/api/branding", {
        name: target.name,
        slogan: target.branding.slogans[0],
        product: target.plan.products.map((product) => product.name).join(", ").slice(0, 500),
        visual_style: target.branding.visual_style,
      });
      if (session !== sessionRef.current) return; // the user opened a different plan meanwhile

      const branding = { ...target.branding, logo_urls: images.logo_urls, banner_url: images.banner_url };
      setBusiness((current) => (current ? { ...current, branding } : current));
      setImageStatus("done");
      setImageNotice(images.placeholder ? t(PLACEHOLDER_NOTICE) : null);

      // Keep an already saved plan in sync with its new images.
      if (savedIdRef.current) {
        const { error: updateError } = await createClient()
          .from("businesses")
          .update({ branding })
          .eq("id", savedIdRef.current);
        if (updateError) setDirty(true);
        else router.refresh();
      }
    } catch (err) {
      if (session !== sessionRef.current) return;
      setImageStatus("error");
      setImageNotice(t(err instanceof Error ? err.message : GENERIC_ERROR));
    }
  }

  // Inserts or updates the business row and returns its id.
  async function persist(): Promise<string> {
    if (!business) throw new Error(SAVE_ERROR);
    const supabase = createClient();
    const payload = {
      name: business.name,
      idea_text: business.idea_text,
      plan: business.plan,
      financial_forecast: business.financial_forecast,
      locations: business.locations,
      branding: business.branding,
    };

    if (savedIdRef.current) {
      if (dirty) {
        const { error: updateError } = await supabase.from("businesses").update(payload).eq("id", savedIdRef.current);
        if (updateError) throw new Error(SAVE_ERROR);
      }
      return savedIdRef.current;
    }

    const { data, error: insertError } = await supabase
      .from("businesses")
      .insert({ ...payload, owner_id: userId })
      .select("id")
      .single();
    if (insertError || !data) throw new Error(SAVE_ERROR);
    return data.id as string;
  }

  async function runAction(action: Exclude<PendingAction, null>) {
    setPendingAction(action);
    setError(null);
    try {
      const id = await persist();
      setSaved(id);
      setDirty(false);
      if (action === "analysis") router.push(`/analysis?business=${id}`);
      else if (action === "dashboard") router.push(`/dashboard?business=${id}`);
      else router.refresh();
    } catch (err) {
      setError(t(err instanceof Error ? err.message : SAVE_ERROR));
    } finally {
      setPendingAction(null);
    }
  }

  function openSaved(saved: Business) {
    const converted = toStudioBusiness(saved);
    if (converted) showResult(converted, saved.id);
  }

  if (phase === "result" && business) {
    return (
      <StudioResults
        business={business}
        saved={savedId !== null && !dirty}
        pendingAction={pendingAction}
        error={error}
        imageStatus={imageStatus}
        imageNotice={imageNotice}
        onSave={() => void runAction("save")}
        onSendToAnalysis={() => void runAction("analysis")}
        onAddToDashboard={() => void runAction("dashboard")}
        onGenerateImages={() => void generateImages(business)}
        onBack={() => {
          sessionRef.current += 1;
          setError(null);
          setPhase("idea");
        }}
      />
    );
  }

  if (phase === "generating") return <GeneratingCard />;

  if (phase === "questions") {
    return <ClarifyChat idea={idea} questions={questions} onComplete={(answers) => void generate(idea, answers)} />;
  }

  return (
    <div className="space-y-8">
      <IdeaForm
        initialIdea={idea}
        loading={phase === "clarifying"}
        error={error}
        onSubmit={(text) => void submitIdea(text)}
      />
      <SavedPlans
        businesses={savedBusinesses.filter((item) => item.plan && item.financial_forecast)}
        onOpen={openSaved}
      />
    </div>
  );
}
