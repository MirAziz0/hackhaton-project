"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { Translate } from "@/lib/i18n/translate";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/i18n/locale-provider";

type Mode = "login" | "register";

const GENERIC_ERROR = "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.";

const FIELD =
  "h-12 w-full rounded-[10px] border border-transparent bg-[#f4f5f9] px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground/30 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-foreground/10 disabled:opacity-60";
const LABEL = "text-sm font-medium text-foreground";
const BUTTON =
  "flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4";

function translateError(message: string, t: Translate) {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return t("E-poçt və ya şifrə yanlışdır.");
  if (text.includes("email not confirmed")) return t("E-poçt ünvanınız hələ təsdiqlənməyib.");
  if (text.includes("env vars")) return t("Supabase konfiqurasiya edilməyib. .env.local faylını yoxlayın.");
  if (text.includes("failed to fetch")) return t("Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.");
  return t(GENERIC_ERROR);
}

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useT();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";

  async function signIn(signInEmail: string, signInPassword: string) {
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });
    if (signInError) throw signInError;
    router.push("/");
    router.refresh();
  }

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : "", t));
      setLoading(false);
    }
  }

  // Sign-up goes through our route handler, which creates a confirmed user (no email step).
  async function handleSignUp() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? t(GENERIC_ERROR));
        setLoading(false);
        return;
      }
      await signIn(email, password);
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : "", t));
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isLogin) void handleSignIn();
    else void handleSignUp();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto my-auto w-full max-w-sm py-10">
        <div className="space-y-3 text-center">
          <h2 className="font-display text-5xl leading-tight tracking-tight text-foreground">
            {isLogin ? t("Xoş gəlmisiniz") : t("Hesab yaradın")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? t("Hesabınıza daxil olmaq üçün e-poçt və şifrənizi yazın")
              : t("Bir dəqiqəyə qeydiyyatdan keçin və ideyanızı plana çevirin")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label htmlFor="fullName" className={LABEL}>
                {t("Ad və soyad")}
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("Adınızı və soyadınızı yazın")}
                autoComplete="name"
                minLength={2}
                required
                className={FIELD}
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className={LABEL}>
              {t("E-poçt")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("E-poçt ünvanınızı yazın")}
              autoComplete="email"
              required
              className={FIELD}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={LABEL}>
              {t("Şifrə")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? t("Şifrənizi yazın") : t("Ən azı 6 simvol")}
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={6}
                required
                className={`${FIELD} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? t("Şifrəni gizlət") : t("Şifrəni göstər")}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-[10px] bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="space-y-3 pt-1">
            <button type="submit" disabled={loading} className={`${BUTTON} bg-black text-white hover:bg-black/85`}>
              {loading && <Loader2 className="animate-spin" />}
              {isLogin ? t("Daxil ol") : t("Qeydiyyatdan keç")}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? t("Hesabınız yoxdur? ") : t("Artıq hesabınız var? ")}
        <Link href={isLogin ? "/register" : "/login"} className="font-semibold text-foreground hover:underline">
          {isLogin ? t("Qeydiyyatdan keçin") : t("Daxil olun")}
        </Link>
      </p>
    </div>
  );
}
