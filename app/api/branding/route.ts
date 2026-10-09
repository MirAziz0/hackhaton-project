import { NextResponse } from "next/server";
import { generateBrandingImages } from "@/lib/ai/branding";
import { toUserError } from "@/lib/ai/errors";
import { brandingRequestSchema } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: t("Davam etmək üçün daxil olun.") }, { status: 401 });
  }

  const parsed = brandingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t("Brend məlumatları düzgün deyil.") }, { status: 400 });
  }
  const { name, slogan, product, visual_style } = parsed.data;

  try {
    const images = await generateBrandingImages({
      userId: user.id,
      name,
      slogan,
      product,
      visualStyle: visual_style,
    });
    return NextResponse.json(images);
  } catch (err) {
    const { message, status } = toUserError(err, t);
    return NextResponse.json({ error: message }, { status });
  }
}
