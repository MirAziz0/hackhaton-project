import { NextResponse } from "next/server";
import { toUserError } from "@/lib/ai/errors";
import { studioRequestSchema } from "@/lib/ai/schemas";
import { clarifyIdea, generatePlan } from "@/lib/ai/studio";
import { getSessionProfile } from "@/lib/supabase/server";
import { getLocale, getT } from "@/lib/i18n/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const t = await getT();
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) {
    return NextResponse.json({ error: t("Davam etmək üçün daxil olun.") }, { status: 401 });
  }

  const parsed = studioRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: t("İdeyanızı bir az daha ətraflı yazın (ən azı 10 simvol).") },
      { status: 400 },
    );
  }
  const { mode, idea, answers = [] } = parsed.data;

  try {
    const locale = await getLocale();
    if (mode === "clarify") {
      return NextResponse.json({ questions: await clarifyIdea(profile, idea, locale) });
    }
    return NextResponse.json({ business: await generatePlan(profile, idea, answers, locale) });
  } catch (err) {
    const { message, status } = toUserError(err, t);
    return NextResponse.json({ error: message }, { status });
  }
}
