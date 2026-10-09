import Link from "next/link";
import {
  BarChart3,
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Palette,
  Rocket,
  SearchCheck,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { LandingBackground } from "@/components/landing/landing-background";
import { LandingNav } from "@/components/landing/landing-nav";
import { BrandName, LogoMark } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

// Floating result cards in the hero: what the platform produces from one idea.
const HERO_CARDS: { icon: LucideIcon; title: string; status: string; tint: string; position: string; delay: string }[] = [
  { icon: FileText, title: "Biznes planı", status: "Hazırlandı", tint: "bg-sky-400/90", position: "left-[18%] top-[6%] -rotate-3", delay: "0s" },
  { icon: Palette, title: "Loqo və brendinq", status: "Yaradıldı", tint: "bg-amber-400/90", position: "right-[4%] top-[30%] rotate-2", delay: "0.8s" },
  { icon: MapPin, title: "Ən yaxşı məkanlar", status: "Tövsiyə olundu", tint: "bg-violet-400/90", position: "left-[4%] top-[54%] -rotate-2", delay: "1.6s" },
  { icon: BarChart3, title: "Maliyyə analizi", status: "Hazırdır", tint: "bg-emerald-400/90", position: "right-[10%] top-[76%] -rotate-3", delay: "2.4s" },
];

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Lightbulb, title: "İdeya Studiyası", text: "Bir cümləlik ideyanı biznes plana, maliyyə proqnozuna, məkan tövsiyəsinə, loqo və bannerə çevirir." },
  { icon: SearchCheck, title: "Biznes Analizi", text: "Planınızı bazar məlumatları ilə yoxlayır, investisiyaya hazırlıq balını və mənbələri göstərir." },
  { icon: LayoutDashboard, title: "Dashboard", text: "Gəlir və xərcləri izləyin. AI köməkçi əməliyyat əlavə edir və suallarınıza rəqəmlərlə cavab verir." },
  { icon: Users, title: "Şəbəkə", text: "Süni intellekt sizə uyğun sahibkarları tapır, səbəbini izah edir; onlarla birbaşa yazışın." },
];

const STEPS = [
  { title: "Özünüzü tanıdın", text: "Qeydiyyatdan sonra 7 qısa suala cavab verin: sahə, mərhələ, büdcə, məkan." },
  { title: "İdeyanızı yazın", text: "Süni intellekt plan, proqnoz, məkan və brend hazırlayır, sonra planı təhlil edir." },
  { title: "Biznesi idarə edin", text: "Gəlir-xərci izləyin, köməkçidən məsləhət alın, tərəfdaş və təchizatçı tapın." },
];

const AUDIENCE: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Rocket, title: "Sahibkarlar", text: "İdeyadan işlək biznesə qədər hər addımda yol göstərən köməkçi." },
  { icon: Landmark, title: "Banklar", text: "KOB kredit müraciətlərini hazırlıq balı və mənbəli təhlillə daha sürətli qiymətləndirin." },
  { icon: Building2, title: "İnkubatorlar", text: "Startap planlarını eyni meyarlarla müqayisə edin və güclü komandaları tez seçin." },
];

const CTA_PRIMARY = "glass-button glass-button-primary h-13 px-8 text-sm";

export async function LandingPage() {
  const t = await getT();
  return (
    <div className="landing-backdrop relative isolate min-h-screen text-white">
      <LandingBackground />
      {/* Floating glass bar that stays at the top while the page scrolls. */}
      <header className="sticky top-4 z-40 px-4 lg:px-10">
        <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full py-2.5 pl-3 pr-2.5">
        <Link href="/" className="flex items-center gap-2.5" aria-label={APP_NAME}>
          <LogoMark />
          <span className="text-xl font-semibold tracking-tight">
            <BrandName dark />
          </span>
        </Link>

        <LandingNav />

        <div className="flex items-center gap-3">
          <LanguageSwitch variant="dark" />
          <Link href="/login" className="glass-button hidden h-11 px-5 text-sm sm:inline-flex">
            {t("Daxil ol")}
          </Link>
          <Link href="/register" className="glass-button glass-button-primary h-11 px-5 text-sm">
            {t("Qeydiyyat")}
          </Link>
        </div>
        </div>
      </header>

      <main>
        <section id="home" className="mx-auto grid scroll-mt-28 max-w-7xl items-center gap-12 px-6 pb-24 pt-10 lg:grid-cols-2 lg:px-10 lg:pt-16">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90">
              <Star className="size-4 fill-[#a78bfa] text-[#a78bfa]" />
              {t("Süni intellektlə işləyən biznes platforması")}
            </p>
            <h1 className="text-5xl font-bold leading-[1.15] tracking-tight sm:text-6xl xl:text-7xl">
              {t("İdeyadan")}
              {/* Padding below the baseline keeps the tails of "ğ" inside the clipped gradient. */}
              <span className="block bg-gradient-to-r from-[#c4b5fd] via-[#a5b4fc] to-[#67e8f9] bg-clip-text pb-3 text-transparent drop-shadow-[0_6px_28px_rgb(139_92_246/0.45)]">
                {t("Biznes Uğuruna")}
              </span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-white/80">
              {t("Planla. Başla. Təhlil et. İdarə et. Böyü.")}
              <br />
              {t("Sahibkarlarla əlaqə qur.")}
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <Link href="/register" className={CTA_PRIMARY}>
                {t("İndi başla")}
              </Link>
            </div>
          </div>

          {/* Decorative composition: a glowing orb with the four result cards floating around it. */}
          <div className="relative mx-auto hidden h-[30rem] w-full max-w-xl lg:block" aria-hidden>
            <div className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#c4b5fd_0%,#7c5cff_38%,#3b82f6_72%,#1e1b4b_100%)] opacity-90 blur-[2px]" />
            <div className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <div className="absolute left-1/2 top-1/2 size-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
            <Sparkles className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 text-white/90" />

            {HERO_CARDS.map(({ icon: Icon, title, status, tint, position, delay }) => (
              <div key={title} className={cn("absolute", position)}>
                <div
                  className="landing-float flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)] backdrop-blur-md"
                  style={{ animationDelay: delay }}
                >
                  <span className={cn("flex size-11 items-center justify-center rounded-xl text-white", tint)}>
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block whitespace-nowrap font-semibold">{t(title)}</span>
                    <span className="block text-sm text-white/70">{t(status)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20 lg:px-10">
          <SectionHeading eyebrow={t("İmkanlar")} title={t("Bir platformada bütün yol")} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 transition-colors hover:bg-white/10">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#7c5cff]/90">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{t(title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{t(text)}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20 lg:px-10">
          <SectionHeading eyebrow={t("Necə işləyir")} title={t("Üç addımda başlayın")} />
          <ol className="mt-12 grid gap-5 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-7">
                <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-5xl font-semibold text-transparent">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{t(step.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{t(step.text)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="audience" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20 lg:px-10">
          <SectionHeading eyebrow={t("Kimlər üçün")} title={t("Sahibkarlar, banklar və inkubatorlar üçün")} />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {AUDIENCE.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="size-6 text-[#a78bfa]" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{t(title)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{t(text)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-10">
          <div className="rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgb(124_92_255/0.45),rgb(59_130_246/0.3))] px-8 py-14 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("İdeyanızı bu gün plana çevirin")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              {t("Qeydiyyat bir dəqiqə çəkir və ilk biznes planınız bir neçə dəqiqəyə hazır olur.")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/register" className={CTA_PRIMARY}>
                {t("Pulsuz başla")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-white/60 lg:px-10">
          <span>© 2026 {APP_NAME}</span>
          <span>{t("Süni intellektli biznes tərəfdaşınız")}</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-widest text-[#a78bfa]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
    </div>
  );
}
