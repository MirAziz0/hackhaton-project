import { NextResponse } from "next/server";
import { toUserError } from "@/lib/ai/errors";
import { studioRequestSchema } from "@/lib/ai/schemas";
import { clarifyIdea, generatePlan } from "@/lib/ai/studio";
import { getSessionProfile } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) {
    return NextResponse.json({ error: "Davam etmək üçün daxil olun." }, { status: 401 });
  }

  const parsed = studioRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "İdeyanızı bir az daha ətraflı yazın (ən azı 10 simvol)." },
      { status: 400 },
    );
  }
  const { mode, idea, answers = [] } = parsed.data;

  try {
    if (mode === "clarify") {
      return NextResponse.json({ questions: await clarifyIdea(profile, idea) });
    }
    return NextResponse.json({ business: await generatePlan(profile, idea, answers) });
  } catch (err) {
    const { message, status } = toUserError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
