import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/ai/analysis";
import { toUserError } from "@/lib/ai/errors";
import { extractPdfText } from "@/lib/analysis/pdf";
import { planTextFromBusiness, planTextFromForm, truncatePlan } from "@/lib/analysis/plan-text";
import { TRACKS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/supabase/server";
import type { Analysis } from "@/types/analysis";
import type { Business } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 120;

// Vercel rejects request bodies above 4.5 MB, so stay safely below that.
const MAX_PDF_BYTES = 4 * 1024 * 1024;

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function field(form: FormData, name: string, maxLength: number) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

// Keeps the uploaded plan in private storage. The analysis never depends on this succeeding.
async function storePdf(userId: string, buffer: Buffer) {
  try {
    const { error } = await createAdminClient()
      .storage.from("plans")
      .upload(`${userId}/${randomUUID()}.pdf`, buffer, { contentType: "application/pdf" });
    if (error) console.warn("[analysis] could not store the PDF:", error.message);
  } catch (err) {
    console.warn("[analysis] could not store the PDF:", err instanceof Error ? err.message : err);
  }
}

async function handle(request: Request) {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) return fail("Davam etmək üçün daxil olun.", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return fail("Sorğu düzgün deyil.");
  const source = field(form, "source", 20);
  const requestedSector = field(form, "sector", 30);
  const sector = TRACKS.some((track) => track.value === requestedSector) ? requestedSector : profile.track;

  let businessId: string | null = null;
  let businessName = "";
  let planText = "";

  if (source === "business") {
    const { data } = await supabase.from("businesses").select("*").eq("id", field(form, "business_id", 64)).maybeSingle();
    const business = data as Business | null;
    if (!business) return fail("Seçilmiş biznes tapılmadı.", 404);
    businessId = business.id;
    businessName = business.name;
    planText = planTextFromBusiness(business);
  } else if (source === "form") {
    const input = {
      name: field(form, "name", 100),
      idea: field(form, "idea", 4000),
      location: field(form, "location", 100),
      budget: field(form, "budget", 20).replace(/[^\d.]/g, ""),
      products: field(form, "products", 1000),
    };
    if (input.name.length < 2 || input.idea.length < 20) {
      return fail("Biznesin adını və ideyanı (ən azı 20 simvol) doldurun.");
    }
    businessName = input.name;
    planText = planTextFromForm(input);
  } else if (source === "pdf") {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return fail("PDF faylı seçin.");
    if (file.size > MAX_PDF_BYTES) return fail("PDF faylı 4 MB-dan böyük olmamalıdır.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return fail("Yalnız PDF formatı qəbul olunur.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    try {
      text = await extractPdfText(buffer);
    } catch (err) {
      console.error("[analysis] PDF parse failed:", err instanceof Error ? err.message : err);
      return fail("PDF faylını oxumaq mümkün olmadı. Başqa fayl yoxlayın və ya formanı doldurun.");
    }
    if (text.length < 100) {
      return fail("PDF-dən mətn oxumaq mümkün olmadı (skan edilmiş sənəd ola bilər). Formanı doldurun.");
    }
    businessName = field(form, "name", 100) || file.name.replace(/\.pdf$/i, "").slice(0, 100) || "Biznes planı";
    planText = truncatePlan(text);
    await storePdf(user.id, buffer);
  } else {
    return fail("Sorğu düzgün deyil.");
  }

  const payload = await runAnalysis({ supabase, profile, businessName, planText, sector });

  // Form and PDF inputs have no business yet, so create one to attach the analysis to.
  if (!businessId) {
    const { data, error } = await supabase
      .from("businesses")
      .insert({ owner_id: user.id, name: businessName, idea_text: planText })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[analysis] could not create the business:", error?.message);
      return fail("Analizi yadda saxlamaq mümkün olmadı.", 500);
    }
    businessId = data.id as string;
  }

  const { data: saved, error: saveError } = await supabase
    .from("analyses")
    .insert({ business_id: businessId, ...payload })
    .select("*")
    .single();
  if (saveError || !saved) {
    console.error("[analysis] could not save the analysis:", saveError?.message);
    return fail("Analizi yadda saxlamaq mümkün olmadı.", 500);
  }

  return NextResponse.json({ analysis: saved as Analysis, business: { id: businessId, name: businessName } });
}

// Every failure is turned into a JSON error, so the client always has a message to show.
export async function POST(request: Request) {
  try {
    return await handle(request);
  } catch (err) {
    const { message, status } = toUserError(err);
    return fail(message, status);
  }
}
