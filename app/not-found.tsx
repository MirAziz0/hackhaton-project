import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Səhifə tapılmadı — Growenta" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="text-6xl font-semibold tracking-tight text-primary">404</p>
        <h1 className="text-2xl font-semibold">Səhifə tapılmadı</h1>
        <p className="max-w-md text-muted-foreground">
          Axtardığınız səhifə mövcud deyil və ya silinib.
        </p>
      </div>
      <Link href="/" className={buttonVariants()}>
        Ana səhifəyə qayıt
      </Link>
    </div>
  );
}
