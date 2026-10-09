import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/layout/logo";
import { AuthBackdrop } from "@/components/auth/auth-backdrop";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { APP_NAME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

// Sign-in / sign-up shell: a white card on a black, animated backdrop. The card's left half
// shows the artwork with a headline; the right half holds the form.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    // The extra top padding keeps the card clear of the "back" button on short and narrow screens.
    <div className="relative isolate flex min-h-screen items-center justify-center bg-black px-4 pb-6 pt-20 sm:px-8 sm:pb-8 sm:pt-24">
      <AuthBackdrop variant="page" />

      {/* The wrapper does the positioning: .glass-button sets its own "position: relative". */}
      <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
        <Link href="/" className="glass-button h-10 px-4 text-sm">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{t("Ana səhifə")}</span>
          <span className="sr-only sm:hidden">{t("Ana səhifəyə qayıt")}</span>
        </Link>
      </div>
      <LanguageSwitch variant="dark" className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6" />

      <div className="grid w-full max-w-6xl rounded-[2rem] bg-white p-2 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] lg:min-h-[44rem] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
        <div className="relative isolate hidden flex-col justify-between overflow-hidden rounded-[1.6rem] bg-black p-10 text-white lg:flex">
          <AuthBackdrop variant="panel" />
          {/* Darkens the bottom so the headline stays readable over the ribbons. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-[1] bg-[linear-gradient(180deg,transparent_45%,rgb(4_2_12/0.85)_100%)]" />

          <p className="flex items-center gap-4 text-xs font-medium uppercase tracking-[0.3em] text-white/90">
            {APP_NAME}
            <span aria-hidden className="h-px w-28 bg-white/70" />
          </p>

          <div className="space-y-5">
            <h1 className="font-display text-6xl leading-[1.05]">
              {/* One line per "|" so each language can break the headline where it reads best. */}
              {t("İdeyadan|Biznes|Uğuruna")
                .split("|")
                .map((line, index) => (
                  <span key={line}>
                    {index > 0 && <br />}
                    {line}
                  </span>
                ))}
            </h1>
            <p className="max-w-xs text-sm leading-relaxed text-white/80">
              {t("Planlayın, təhlil edin və idarə edin. Hər addımda süni intellekt yanınızdadır.")}
            </p>
          </div>
        </div>

        <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 lg:py-10">
          <Link href="/" className="mx-auto flex items-center gap-2 text-foreground" aria-label={t("{app} ana səhifə", { app: APP_NAME })}>
            <LogoMark className="size-9" />
            <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
