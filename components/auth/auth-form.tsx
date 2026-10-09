"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

const GENERIC_ERROR = "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.";

function translateError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) return "E-poçt və ya şifrə yanlışdır.";
  if (text.includes("email not confirmed")) return "E-poçt ünvanınız hələ təsdiqlənməyib.";
  if (text.includes("env vars")) return "Supabase konfiqurasiya edilməyib. .env.local faylını yoxlayın.";
  if (text.includes("failed to fetch")) return "Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.";
  return GENERIC_ERROR;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"form" | "demo" | null>(null);
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

  async function handleSignIn(signInEmail: string, signInPassword: string, source: "form" | "demo") {
    setLoading(source);
    setError(null);
    try {
      await signIn(signInEmail, signInPassword);
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ""));
      setLoading(null);
    }
  }

  // Sign-up goes through our route handler, which creates a confirmed user (no email step).
  async function handleSignUp() {
    setLoading("form");
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? GENERIC_ERROR);
        setLoading(null);
        return;
      }
      await signIn(email, password);
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ""));
      setLoading(null);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isLogin) void handleSignIn(email, password, "form");
    else void handleSignUp();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {isLogin ? "Xoş gəlmisiniz" : "Hesab yaradın"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isLogin
            ? "Davam etmək üçün hesabınıza daxil olun."
            : "Bir neçə saniyəyə qeydiyyatdan keçin və başlayın."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Ad və soyad</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aysel Məmmədova"
              autoComplete="name"
              minLength={2}
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">E-poçt</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="siz@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Şifrə</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ən azı 6 simvol"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading !== null}>
          {loading === "form" && <Loader2 className="animate-spin" />}
          {isLogin ? "Daxil ol" : "Qeydiyyatdan keç"}
        </Button>
      </form>

      {isLogin && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            və ya
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="outline"
            className="w-full"
            disabled={loading !== null}
            onClick={() => void handleSignIn(DEMO_EMAIL, DEMO_PASSWORD, "demo")}
          >
            {loading === "demo" ? <Loader2 className="animate-spin" /> : <PlayCircle />}
            Demo hesabı ilə daxil ol
          </Button>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Hesabınız yoxdur? " : "Artıq hesabınız var? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-primary hover:underline">
          {isLogin ? "Qeydiyyatdan keçin" : "Daxil olun"}
        </Link>
      </p>
    </div>
  );
}
