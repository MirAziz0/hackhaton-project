import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("Səhifə tapılmadı")} — Growenta` };
}

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="text-6xl font-semibold tracking-tight text-primary">404</p>
        <h1 className="text-2xl font-semibold">{t("Səhifə tapılmadı")}</h1>
        <p className="max-w-md text-muted-foreground">
          {t("Axtardığınız səhifə mövcud deyil və ya silinib.")}
        </p>
      </div>
      <Link href="/" className={buttonVariants()}>
        {t("Ana səhifəyə qayıt")}
      </Link>
    </div>
  );
}
