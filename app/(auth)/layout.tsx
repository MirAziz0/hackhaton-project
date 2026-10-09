import Link from "next/link";
import { Rocket } from "lucide-react";
import { AuthBackdrop } from "@/components/auth/auth-backdrop";
import { APP_NAME } from "@/lib/constants";

// Sign-in / sign-up shell: a white card on a black, animated backdrop. The card's left half
// shows the artwork with a headline; the right half holds the form.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center bg-black p-4 sm:p-8">
      <AuthBackdrop variant="page" />

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
              İdeyadan
              <br />
              Biznes
              <br />
              Uğuruna
            </h1>
            <p className="max-w-xs text-sm leading-relaxed text-white/80">
              Planlayın, təhlil edin və idarə edin. Hər addımda süni intellekt yanınızdadır.
            </p>
          </div>
        </div>

        <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16 lg:py-10">
          <Link href="/" className="mx-auto flex items-center gap-2 text-foreground" aria-label={`${APP_NAME} ana səhifə`}>
            <Rocket className="size-5" />
            <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
