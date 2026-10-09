import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/server";

const bodySchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(72),
});

// Creates an already-confirmed user, so sign-up works without email verification
// regardless of the "Confirm email" setting in the Supabase dashboard.
export async function POST(request: Request) {
  const t = await getT();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t("Məlumatlar düzgün doldurulmayıb.") }, { status: 400 });
  }
  const { fullName, email, password } = parsed.data;

  const { error } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    const exists = error.code === "email_exists" || /already (been )?registered/i.test(error.message);
    return NextResponse.json(
      {
        error: exists
          ? t("Bu e-poçt ilə artıq hesab mövcuddur. Daxil olun.")
          : t("Hesab yaratmaq mümkün olmadı. Zəhmət olmasa yenidən cəhd edin."),
      },
      { status: exists ? 409 : 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
